import { getPlans } from '../lib/firebaseFunction/index';

export const convertToBlobUrl = async (image) => {
  try {
    const response = await fetch(image);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
  } catch (error) {
    console.error('Error converting image to blob:', error);
  }
};

export const getInitials = (name) => {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.seconds * 1000);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export const formatDashboardDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.seconds * 1000);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  } else {
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
  }
};

export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone.replace(/\s+/g, ''));
};

export const validateDomain = (domain) => {
  // Basic domain validation regex
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domain || domain.trim() === '') {
    return {
      isValid: false,
      message: 'Domain cannot be empty.',
    };
  }

  if (!domainRegex.test(domain)) {
    return {
      isValid: false,
      message:
        'Domain must contain only letters, numbers, and hyphens. It cannot start or end with a hyphen.',
    };
  }

  if (domain.includes('--')) {
    return {
      isValid: false,
      message: 'Domain cannot contain consecutive hyphens',
    };
  }
  return {
    isValid: true,
    message: 'Domain is valid',
  };
};

export const validateSubdomain = (subdomain) => {
  if (!subdomain || subdomain.trim() === '') {
    return {
      isValid: false,
      message: 'Subdomain cannot be empty',
    };
  }

  if (subdomain.length > 63) {
    return {
      isValid: false,
      message: 'Subdomain cannot exceed 63 characters',
    };
  }

  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (!subdomainRegex.test(subdomain)) {
    return {
      isValid: false,
      message:
        'Subdomain must contain only letters, numbers, and hyphens. It cannot start or end with a hyphen.',
    };
  }

  if (subdomain.includes('--')) {
    return {
      isValid: false,
      message: 'Subdomain cannot contain consecutive hyphens',
    };
  }

  return {
    isValid: true,
    message: 'Subdomain is valid',
  };
};

export const calculateSevenDaysFromNow = () => {
  const now = Date.now();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
  const timeInSec = Math.floor(sevenDaysFromNow / 1000);
  return timeInSec;
};

export const calculateNextMonthYear = ({ isMonthly, timestamp, totalYear = 1 }) => {
  const today = timestamp ? new Date(timestamp * 1000) : new Date();

  if (isMonthly) {
    let nextMonth = today.getMonth() + 1;
    let nextYear = today.getFullYear();

    if (nextMonth === 12) {
      nextMonth = 0; // January (0-indexed)
      nextYear++;
    }

    const date = new Date(today);
    date.setMonth(nextMonth);
    const newDate = new Date(
      nextYear,
      nextMonth,
      today.getDate(),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds(),
      today.getMilliseconds(),
    );

    return Math.floor(newDate.getTime() / 1000);
  } else {
    today.setFullYear(today.getFullYear() + totalYear);
    return Math.floor(today.getTime() / 1000);
  }
};

export const continueWithBasic = async ({ isOutsideIndia }) => {
  const response = await getPlans({ isOutsideIndia });
  const planDetail = response.plans[0];
  const timestamp = Math.floor(Date.now() / 1000);

  const planData = {
    title: planDetail.title,
    isAnnual: true,
    price: planDetail.yearlyPrice,
    features: planDetail.features,
    planId: planDetail.yearlyPlanId,
    totalYears: 6,
    startDate: timestamp,
    subscriptionId: '',
    nextBillingDate: calculateNextMonthYear({
      isMonthly: false,
      timestamp,
      totalYear: 6,
    }),
  };
  return planData;
};

export const calculateTimeLeft = (completionTime) => {
  const totalTimeInSeconds = 120; // 2 minutes in seconds
  const timeUsed = Math.floor((completionTime / 100) * totalTimeInSeconds);
  const timeLeft = totalTimeInSeconds - timeUsed;
  return Math.max(0, timeLeft);
};

export const calculateProfileCompletion = (fields) => {
  const completedFields = fields.filter(
    (field) => field !== undefined && field !== null && field !== '',
  ).length;
  return {
    timeTaken: Math.round((completedFields / fields.length) * 100),
    totalSteps: completedFields,
  };
};

export const calculateCompletion = (fields) => {
  const { conversations, lastDeployedAt, domains } = fields;
  const totalFields = Object.keys(fields).length + 1;
  const percentagePerField = 100 / totalFields; // Calculate percentage contribution per field
  let completedFields = 0;

  // Check if conversations exist and have content
  if (conversations && conversations.length > 0) {
    completedFields += 1;
  }

  if (conversations && conversations.length > 2) {
    completedFields += 1;
  }
  // Check if site has been deployed
  if (lastDeployedAt) {
    completedFields += 1;
  }

  // Check if domains are configured
  if (domains && Object.keys(domains).length > 0) {
    completedFields += 1;
  }

  const percentage = completedFields * percentagePerField;

  return {
    remainingTime: Math.round(percentage),
    completedSteps: completedFields,
    totalNumber: totalFields,
  };
};

export const decodeHtmlEntities = (html) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  const value = textarea.value;
  textarea.remove(); // Clean up the DOM by removing the temporary element
  return value;
};

// Convert any file size to KB
export const toKB = (size, type) => {
  const normalizedSize = Number(size) || 0;
  switch ((type || '').toLowerCase()) {
    case 'gb':
      return normalizedSize * 1024 * 1024;
    case 'mb':
      return normalizedSize * 1024;
    case 'kb':
      return normalizedSize;
    case 'b':
    default:
      return normalizedSize / 1024;
  }
};

// Main conversion function — always returns KB
export function totalSizeInKB({
  fileSize,
  fileType = 'B',
  workspaceDataSize = 0,
  workspaceDataSizeType = 'B',
  calc = 'add',
  decimals = 2,
}) {
  const fileKB = toKB(fileSize, fileType);
  const workspaceKB = toKB(workspaceDataSize, workspaceDataSizeType);

  const resultKB = calc === 'sub' ? Math.max(0, workspaceKB - fileKB) : workspaceKB + fileKB;

  const factor = 10 ** decimals;
  const roundedKB = Math.round(resultKB * factor) / factor;

  return {
    displayValue: roundedKB,
    displayType: 'KB',
  };
}

// Convert bytes to KB (only), return rounded KB
export const convertFileKB = (fileSizeInBytes, decimals = 2) => {
  const bytes = Number(fileSizeInBytes);
  if (isNaN(bytes)) {
    console.warn('convertFileKB received invalid fileSizeInBytes:', fileSizeInBytes);
    return { displayValue: 0, displayType: 'KB' };
  }

  const kb = bytes / 1024;
  const factor = 10 ** decimals;
  const roundedKB = Math.round(kb * factor) / factor;

  return {
    displayValue: roundedKB,
    displayType: 'KB',
  };
};

export const autoConvertSize = (size, inputUnit = 'B', decimals = 2) => {
  const factor = 10 ** decimals;
  let sizeInBytes;

  // Normalize input size to bytes
  switch (inputUnit.toUpperCase()) {
    case 'KB':
      sizeInBytes = size * 1024;
      break;
    case 'MB':
      sizeInBytes = size * 1024 * 1024;
      break;
    default:
      sizeInBytes = size;
  }

  let displayValue;
  let displayUnit;

  if (sizeInBytes >= 1024 * 1024) {
    displayValue = sizeInBytes / (1024 * 1024);
    displayUnit = 'MB';
  } else if (sizeInBytes >= 1024) {
    displayValue = sizeInBytes / 1024;
    displayUnit = 'KB';
  } else {
    displayValue = sizeInBytes;
    displayUnit = 'B';
  }

  return {
    fileSize: Math.round(displayValue * factor) / factor,
    fileType: displayUnit,
  };
};

export const dateIsoConverter = ({ startDate, endDate }) => {
  if (!startDate || !endDate) {
    return { sDate: '', eDate: '' };
  }
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const sDate = start.toISOString();
  const eDate = end.toISOString();
  return { sDate, eDate };
};

export const getOrientation = (width, height) => {
  let orientation = ''; // landscape | potrait | squarish
  if (width < height) {
    orientation = 'portrait';
  } else if (width > height) {
    orientation = 'landscape';
  } else {
    orientation = 'squarish';
  }
  return orientation;
};

export const numberFormatter = (originalPrice = 0) => {
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  });

  return currencyFormatter.format(originalPrice);
};

// Helper to normalize HTML (remove extra whitespace, comments potentially)
export const normalizeHtml = (html) => {
  if (!html) return '';
  // Basic normalization: trim and reduce multiple spaces
  // More robust normalization could involve parsing and reserializing,
  // but might be overkill and could alter structure slightly.
  return html.replace(`//gs`, '').replace(/\s+/g, ' ').trim();
  // return html;
};

export function extractFilePathFromUrl(url) {
  const storageBaseUrl = 'https://storage.googleapis.com/sitebuild-prod.firebasestorage.app/';

  if (!url.startsWith(storageBaseUrl)) {
    throw new Error('URL does not match expected Firebase Storage base URL');
  }

  // Remove the base URL and query parameters to get the file path
  const pathWithQuery = url.slice(storageBaseUrl.length);
  const filePath = pathWithQuery.split('?')[0];

  return filePath;
}

export const validateWorkspaceName = (name) => {
  const minLength = 3;
  const maxLength = 30;
  const validNameRegex = /^[a-zA-Z0-9 _-]+$/;
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      message: 'Please enter a valid workspace name.',
    };
  }
  const trimmed = name.trim();
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      message: 'Workspace name must be at least 3 characters.',
    };
  }
  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      message: 'Workspace name must be less than 30 characters.',
    };
  }
  if (!validNameRegex.test(trimmed)) {
    return {
      isValid: false,
      message: 'Workspace name can only contain letters, numbers, spaces, dashes, and underscores.',
    };
  }
  return { isValid: true, message: '' };
};

export function formatNumber(number, locale = 'en-IN') {
  return new Intl.NumberFormat(locale).format(number);
}
