import { getTokenId } from '../context/AuthContext';

const VERIFICATION_URL = process.env.REACT_APP_VERIFICATION_URL;
const DOMAIN_URL = process.env.REACT_APP_DOMAIN_URL;
const SUBDOMAIN_API_URL = process.env.REACT_APP_SUBDOMAIN_API_URL;
const REMOVE_DOMAIN_URL = process.env.REACT_APP_REMOVE_DOMAIN;
const PAGE_VIEW_URL = `${process.env.REACT_APP_GA_URL}/api/total-views`;
const GA_CONFIG_URL = `${process.env.REACT_APP_GA_URL}/api/config`;

export const verificationApi = async ({ siteId, domainName }) => {
  const payload = {
    site_id: siteId,
    domain: domainName,
  };
  const token = await getTokenId();
  const res = await fetch(VERIFICATION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res;
};

export const domainApi = async ({ siteId, domainName }) => {
  const payload = { site_id: siteId, domain: domainName, is_subdomain: false };
  const token = await getTokenId();
  // Make the domain API call
  const response = await fetch(`${DOMAIN_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response;
};

export const subDomainApi = async ({ siteId, subDomain }) => {
  const payload = { site_id: siteId, subdomain: subDomain };
  const token = await getTokenId();
  // Make the subdomain API call
  const response = await fetch(`${SUBDOMAIN_API_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response;
};

export const deleteDomainApi = async ({ siteId, domain }) => {
  const payload = { site_id: siteId, domain };
  const token = await getTokenId();
  // Make the subdomain API call
  const response = await fetch(`${REMOVE_DOMAIN_URL}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response;
};

export const gaGetTotalView = async (propertyId = '') => {
  // const token = await getTokenId();
  // await fetch(`${GA_CONFIG_URL}`, {
  //   method: 'POST',
  //   headers: {
  //     // Authorization: `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ propertyId }),
  // });

  const response = await fetch(`${PAGE_VIEW_URL}`, {
    method: 'GET',
    headers: {
      // Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response;
};

export const gaUpdateConfig = async (propertyId = '') => {
  // const token = await getTokenId();
  const response = await fetch(`${GA_CONFIG_URL}`, {
    method: 'POST',
    headers: {
      // Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ propertyId }),
  });

  return response;
};
