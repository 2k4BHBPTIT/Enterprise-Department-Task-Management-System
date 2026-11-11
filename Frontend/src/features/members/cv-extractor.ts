export interface ExtractedCvProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  education?: string;
  specialization?: string;
  experienceYears?: string;
  skills?: string;
  address?: string;
}

export interface CvExtractionResult {
  profile: ExtractedCvProfile;
  sourceText: string;
}

export type CvExtractionProgress = (message: string) => void;

const OCR_LANGUAGE = 'vie+eng';
const MAX_OCR_PDF_PAGES = 20;

const normalizeForMatching = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

const cleanValue = (value: string) =>
  value.replace(/^[\s:：|–—-]+|[\s|]+$/g, '').replace(/\s+/g, ' ').trim();

const readLabeledValue = (lines: string[], labels: string[]) => {
  const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const matcher = new RegExp(`^\\s*(?:${labelPattern})\\s*[:：|–—-]\\s*(.+?)\\s*$`, 'i');
  for (const line of lines) {
    const match = line.match(matcher);
    if (match?.[1]) return cleanValue(match[1]);
  }
  return '';
};

const createOcrWorker = async (onProgress?: CvExtractionProgress) => {
  const { createWorker } = await import('tesseract.js');
  return createWorker(OCR_LANGUAGE, undefined, {
    logger: ({ status, progress }) => {
      const percent = Math.round(progress * 100);
      if (status === 'loading language traineddata') {
        onProgress?.('Đang tải dữ liệu ngôn ngữ OCR tiếng Việt và tiếng Anh...');
      } else if (status === 'recognizing text') {
        onProgress?.(`Đang nhận diện văn bản bằng OCR (${percent}%)...`);
      } else if (status === 'loading tesseract core') {
        onProgress?.('Đang khởi tạo bộ máy OCR...');
      }
    },
  });
};

const extractImageText = async (file: File, onProgress?: CvExtractionProgress) => {
  const worker = await createOcrWorker(onProgress);
  try {
    onProgress?.('Đang nhận diện nội dung ảnh CV...');
    const result = await worker.recognize(file);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
};

const extractPdfText = async (file: File, onProgress?: CvExtractionProgress) => {
  const [pdfjs, pdfWorker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker.default;
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await loadingTask.promise;
  try {
    const pageTexts: string[] = [];
    const pagesNeedingOcr: number[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = '';
      for (const item of content.items) {
        if (!('str' in item)) continue;
        pageText += item.str;
        pageText += 'hasEOL' in item && item.hasEOL ? '\n' : ' ';
      }
      pageTexts.push(pageText);
      if (pageText.trim().length < 40) pagesNeedingOcr.push(pageNumber - 1);
    }
    if (pagesNeedingOcr.length === 0) return pageTexts.join('\n');
    if (pagesNeedingOcr.length > MAX_OCR_PDF_PAGES) {
      throw new Error(`CV PDF có ${pagesNeedingOcr.length} trang cần OCR; hiện hỗ trợ tối đa ${MAX_OCR_PDF_PAGES} trang mỗi lần.`);
    }

    onProgress?.('Phát hiện trang scan trong PDF. Đang khởi tạo OCR...');
    const worker = await createOcrWorker(onProgress);
    try {
      for (let index = 0; index < pagesNeedingOcr.length; index += 1) {
        const pageNumber = pagesNeedingOcr[index];
        onProgress?.(`Đang OCR trang ${pageNumber + 1}/${pdf.numPages}...`);
        const page = await pdf.getPage(pageNumber + 1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Trình duyệt không thể tạo canvas để đọc PDF scan.');
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const result = await worker.recognize(canvas);
        pageTexts[pageNumber] = [pageTexts[pageNumber], result.data.text].filter(Boolean).join('\n');
        canvas.width = 0;
        canvas.height = 0;
      }
      return pageTexts.join('\n');
    } finally {
      await worker.terminate();
    }
  } finally {
    await loadingTask.destroy();
  }
};

const extractFileText = async (file: File, onProgress?: CvExtractionProgress) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'txt') return file.text();
  if (extension === 'pdf') return extractPdfText(file, onProgress);
  if (extension === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(extension || '')) {
    return extractImageText(file, onProgress);
  }
  throw new Error('Định dạng CV chưa được hỗ trợ. Vui lòng sử dụng PDF, DOCX, TXT, PNG, JPG hoặc WEBP.');
};

const extractDate = (text: string) => {
  const match = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b|\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (!match) return '';
  if (match[4]) return `${match[4]}-${match[5]}-${match[6]}`;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (day > 31 || month > 12 || day < 1 || month < 1) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const extractSection = (lines: string[], labels: string[], nextSectionLabels: string[]) => {
  const normalizedLabels = labels.map(normalizeForMatching);
  const normalizedNextLabels = nextSectionLabels.map(normalizeForMatching);
  const isHeading = (line: string, headings: string[]) => {
    const normalized = normalizeForMatching(line.trim());
    return headings.some((label) =>
      normalized === label
      || normalized.startsWith(`${label}:`)
      || normalized.startsWith(`${label} `)
      || normalized.startsWith(`${label} -`),
    );
  };
  const start = lines.findIndex((line) => isHeading(line, normalizedLabels));
  if (start < 0) return '';

  const nextSection = lines.findIndex((line, index) => index > start && isHeading(line, normalizedNextLabels));
  const heading = lines[start];
  const normalizedHeading = normalizeForMatching(heading);
  const labelIndex = normalizedLabels.findIndex((label) => normalizedHeading === label || normalizedHeading.startsWith(`${label}:`) || normalizedHeading.startsWith(`${label} `) || normalizedHeading.startsWith(`${label} -`));
  const matchedLabel = labels[labelIndex] || '';
  const firstLine = normalizedHeading === normalizedLabels[labelIndex]
    ? ''
    : heading.slice(matchedLabel.length).replace(/^[\s:：|–—-]+/, '');
  const end = nextSection < 0 ? Math.min(lines.length, start + 5) : Math.min(nextSection, start + 5);
  const content = [firstLine, ...lines.slice(start + 1, end)]
    .map(cleanValue)
    .filter((line) => line && !normalizedNextLabels.some((label) => normalizeForMatching(line).startsWith(label)));
  return cleanValue(content.join(' '));
};

const knownSkills = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Java', 'Spring Boot',
  'C#', '.NET', 'Python', 'Django', 'Flask', 'PHP', 'Laravel', 'Go', 'Golang', 'C++',
  'SQL', 'MySQL', 'PostgreSQL', 'SQL Server', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'Git', 'HTML', 'CSS', 'Tailwind CSS', 'Figma', 'Jira',
  'Excel', 'Power BI', 'Tableau', 'Machine Learning', 'TensorFlow', 'PyTorch',
  'Agile', 'Scrum', 'REST API', 'GraphQL', 'Linux', 'Selenium', 'Cypress',
];

const commonSectionHeadings = [
  'Kinh nghiệm', 'Experience', 'Học vấn', 'Education', 'Chứng chỉ', 'Certifications',
  'Projects', 'Dự án', 'References', 'Người tham chiếu', 'Mô tả', 'Description',
  'Summary', 'Professional summary', 'Profile', 'Thông tin cá nhân', 'Personal information',
  'Liên hệ', 'Contact', 'Mục tiêu nghề nghiệp', 'Career objective', 'Sở thích', 'Interests',
];

const findSkills = (text: string) => {
  const normalizedText = normalizeForMatching(text);
  return knownSkills.filter((skill) => {
    const normalizedSkill = normalizeForMatching(skill);
    const escaped = normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return new RegExp(`(^|[^a-z0-9+#.])${escaped}(?=$|[^a-z0-9+#.])`, 'i').test(normalizedText);
  });
};

const extractExperienceYears = (text: string) => {
  const explicit = [
    /(?:kinh\s*nghi[eệ]m|experience)\s*[:：-]?\s*(\d{1,2})\s*\+?\s*(?:n[aă]m|years?)/i,
    /(\d{1,2})\s*\+?\s*(?:n[aă]m|years?)\s*(?:kinh\s*nghi[eệ]m|of\s+experience)/i,
  ];
  for (const pattern of explicit) {
    const years = Number(text.match(pattern)?.[1]);
    if (years >= 0 && years <= 60) return String(years);
  }
  return '';
};

const extractName = (lines: string[]) => {
  const labeled = readLabeledValue(lines, [
    'Họ và tên', 'Họ tên', 'Tên ứng viên', 'Tên', 'Full name', 'Candidate name', 'Applicant name',
  ]);
  if (!labeled || labeled.length > 80 || /[@\d]/.test(labeled)) return '';
  const words = labeled.split(/\s+/);
  return words.length >= 2 && words.length <= 6 ? labeled : '';
};

export const extractCvProfile = async (file: File, onProgress?: CvExtractionProgress): Promise<CvExtractionResult> => {
  const text = await extractFileText(file, onProgress);
  if (!text.trim()) {
    throw new Error('OCR không nhận diện được văn bản trong CV. Vui lòng dùng ảnh hoặc PDF scan rõ nét hơn.');
  }

  const lines = text.split(/\r?\n/).map((line) => cleanValue(line)).filter(Boolean);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phoneCandidate = text.match(/(?:\+?84|0)(?:[\s().-]?\d){8,10}\b/)?.[0] || '';
  const phoneDigits = phoneCandidate.replace(/\D/g, '');
  const phone = phoneDigits.length >= 9 && phoneDigits.length <= 12 ? phoneDigits : '';
  const dateOfBirthLabel = readLabeledValue(lines, ['Ngày sinh', 'Date of birth', 'DOB', 'Birth date']);
  const dateOfBirth = extractDate(dateOfBirthLabel);
  const labeledEducation = readLabeledValue(lines, ['Học vấn', 'Trình độ học vấn', 'Bằng cấp', 'Education', 'Education background', 'Qualification']);
  const educationSection = labeledEducation || extractSection(
    lines,
    ['Học vấn', 'Trình độ học vấn', 'Education', 'Education background', 'Qualifications'],
    [...commonSectionHeadings, 'Kỹ năng', 'Skills'],
  );
  const experienceYears = extractExperienceYears(text);
  const specialization = readLabeledValue(lines, ['Chuyên môn', 'Lĩnh vực chuyên môn', 'Specialization', 'Major', 'Professional field']);
  const skillsSection = readLabeledValue(lines, ['Kỹ năng', 'Kỹ năng chuyên môn', 'Skills', 'Technical skills'])
    || extractSection(
      lines,
      ['Kỹ năng', 'Kỹ năng chuyên môn', 'Skills', 'Technical skills', 'Core competencies'],
      commonSectionHeadings,
    );
  const skills = [...new Set(findSkills(skillsSection))].join(', ');
  const address = readLabeledValue(lines, ['Địa chỉ', 'Address', 'Location']);
  const profile: ExtractedCvProfile = {
    fullName: extractName(lines),
    email,
    phone,
    dateOfBirth,
    education: educationSection,
    specialization,
    experienceYears,
    skills,
    address,
  };

  return { profile, sourceText: text };
};
