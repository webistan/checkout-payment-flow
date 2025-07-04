import { numberFormatter } from '../helper';

export const getProgressiveDiscountSummary = ({
  basePrice,
  years = 10,
  minDiscount = 15,
  maxDiscount = 70,
}) => {
  const step = (maxDiscount - minDiscount) / (years - 1);
  const result = [];

  let totalBasePrice = 0;
  let totalFinalPrice = 0;

  for (let year = 1; year <= years; year++) {
    const yearlyBasePrice = basePrice * year;
    const discountPercent = Math.floor(minDiscount + (year - 1) * step);
    const finalPrice = Math.round(yearlyBasePrice * (1 - discountPercent / 100));
    const discountPrice = Math.round(yearlyBasePrice * (discountPercent / 100));

    totalBasePrice += yearlyBasePrice;
    totalFinalPrice += finalPrice;

    result.push({
      year,
      yearlyBasePrice,
      discount: discountPercent,
      discountPrice,
      finalPrice,
      totalSaved: totalBasePrice - totalFinalPrice,
    });
  }

  return result;
};

export const calculateFeatureValue = (value, isAnnual, totalYears) => {
  if (typeof value === 'boolean') {
    return value;
  }
  return isAnnual ? value * 1 : Math.max(2, Math.round(value / 12));
};

export const calculateStorageValue = (value, isAnnual, totalYears) => {
  const parts = value.toString().trim().split(' ');

  if (parts.length < 2) return value;

  const numericValue = parseInt(parts[0]);
  const unit = parts[1];

  if (isNaN(numericValue)) return value;

  const calculatedValue = isAnnual ? numericValue * totalYears : Math.round(numericValue / 12);
  if (calculatedValue < 1) {
    const upperUnit = unit.toUpperCase();

    if (upperUnit === 'GB') {
      return `${Math.max(1, Math.round((numericValue * 1024) / 12))} MB`;
    } else if (upperUnit === 'MB') {
      return `${Math.max(1, Math.round((numericValue * 1024) / 12))} KB`;
    }

    return `1 ${unit}`;
  }

  // Check if we should convert to a larger unit for better readability
  if (calculatedValue >= 1024) {
    const upperUnit = unit.toUpperCase();

    if (upperUnit === 'KB') {
      const mbValue = Math.round(calculatedValue / 1024);
      if (mbValue >= 1) {
        return `${mbValue} MB`;
      }
    } else if (upperUnit === 'MB') {
      const gbValue = Math.round(calculatedValue / 1024);
      if (gbValue >= 1) {
        return `${gbValue} GB`;
      }
    }
  }

  return `${calculatedValue} ${unit}`;
};

export const getModifiedDescription = (feature, plan, isAnnual, totalYears = 1) => {
  if (!feature.key || !plan.features[feature.key]) {
    return feature.description;
  }
  let featureValue = plan.features[feature.key];

  // Special handling for workspaceStorageLimit
  if (feature.key === 'workspaceStorageLimit') {
    const storageValue = calculateStorageValue(featureValue, isAnnual, isAnnual ? totalYears : 1);
    return `${feature.description} ${storageValue}`;
  }

  if (feature.key === 'hostingDuration') {
    const numberValue = featureValue.split(' ')[0];
    return `${feature.description} ${isAnnual ? `${numberValue * totalYears} Year` : '1 Month'}`;
  }

  if (typeof featureValue !== 'number') {
    return `${feature.description} ${featureValue}`;
  }

  // Calculate the value based on billing cycle
  // For yearly, multiply by totalYears parameter
  const displayValue = isAnnual ? featureValue * 1 : Math.max(2, Math.round(featureValue / 12));

  const period = isAnnual ? '/year' : '';
  const formattedValue =
    feature.key === 'monthlyVisitorLimit'
      ? `${numberFormatter(displayValue)}${period}`
      : `${displayValue}${period}`;

  return `${feature.description} ${formattedValue}`;
};
