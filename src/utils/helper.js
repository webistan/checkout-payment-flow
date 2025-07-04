import { getPlans } from "../lib/firebaseFunction/index";

export const convertToBlobUrl = async (image) => {
  try {
    const response = await fetch(image);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
  } catch (error) {
    console.error("Error converting image to blob:", error);
  }
};

export const getInitials = (name) => {
  if (!name) return "";
  const words = name.split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp.seconds * 1000);
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};

export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone.replace(/\s+/g, ""));
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
      today.getMilliseconds()
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
    subscriptionId: "",
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

// Convert any file size to KB
export const toKB = (size, type) => {
  const normalizedSize = Number(size) || 0;
  switch ((type || "").toLowerCase()) {
    case "gb":
      return normalizedSize * 1024 * 1024;
    case "mb":
      return normalizedSize * 1024;
    case "kb":
      return normalizedSize;
    case "b":
    default:
      return normalizedSize / 1024;
  }
};

// Main conversion function — always returns KB
export function totalSizeInKB({
  fileSize,
  fileType = "B",
  workspaceDataSize = 0,
  workspaceDataSizeType = "B",
  calc = "add",
  decimals = 2,
}) {
  const fileKB = toKB(fileSize, fileType);
  const workspaceKB = toKB(workspaceDataSize, workspaceDataSizeType);

  const resultKB = calc === "sub" ? Math.max(0, workspaceKB - fileKB) : workspaceKB + fileKB;

  const factor = 10 ** decimals;
  const roundedKB = Math.round(resultKB * factor) / factor;

  return {
    displayValue: roundedKB,
    displayType: "KB",
  };
}

// Convert bytes to KB (only), return rounded KB
export const convertFileKB = (fileSizeInBytes, decimals = 2) => {
  const bytes = Number(fileSizeInBytes);
  if (isNaN(bytes)) {
    console.warn("convertFileKB received invalid fileSizeInBytes:", fileSizeInBytes);
    return { displayValue: 0, displayType: "KB" };
  }

  const kb = bytes / 1024;
  const factor = 10 ** decimals;
  const roundedKB = Math.round(kb * factor) / factor;

  return {
    displayValue: roundedKB,
    displayType: "KB",
  };
};

export const autoConvertSize = (size, inputUnit = "B", decimals = 2) => {
  const factor = 10 ** decimals;
  let sizeInBytes;

  // Normalize input size to bytes
  switch (inputUnit.toUpperCase()) {
    case "KB":
      sizeInBytes = size * 1024;
      break;
    case "MB":
      sizeInBytes = size * 1024 * 1024;
      break;
    default:
      sizeInBytes = size;
  }

  let displayValue;
  let displayUnit;

  if (sizeInBytes >= 1024 * 1024) {
    displayValue = sizeInBytes / (1024 * 1024);
    displayUnit = "MB";
  } else if (sizeInBytes >= 1024) {
    displayValue = sizeInBytes / 1024;
    displayUnit = "KB";
  } else {
    displayValue = sizeInBytes;
    displayUnit = "B";
  }

  return {
    fileSize: Math.round(displayValue * factor) / factor,
    fileType: displayUnit,
  };
};

export const dateIsoConverter = ({ startDate, endDate }) => {
  if (!startDate || !endDate) {
    return { sDate: "", eDate: "" };
  }
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const sDate = start.toISOString();
  const eDate = end.toISOString();
  return { sDate, eDate };
};

export const numberFormatter = (originalPrice = 0) => {
  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  });

  return currencyFormatter.format(originalPrice);
};

export function formatNumber(number, locale = "en-IN") {
  return new Intl.NumberFormat(locale).format(number);
}

// Detect user location (India or outside)
export const detectLocation = async () => {
  let outsideIndia = true;
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    if (data.country !== "IN") {
      outsideIndia = true;
      console.log("User location detected outside India:", data.country);
    } else {
      outsideIndia = false;

      console.log("User location detected in India");
    }
  } catch (error) {
    console.error("Error fetching IP location:", error);
    outsideIndia = false;
  }
  return outsideIndia;
};
