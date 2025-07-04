import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { auth } from '../../firebaseConfig';
import { internationalPlans, plans } from '../../components/constants';
import { continueWithBasic } from '../../utils/helper';
import { ERROR_MSZ } from '../constants/errorMsz';

export const createUpdateUser = async (data, result = {}, isOutsideIndia) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');

    const userRef = doc(db, `users/${user.uid}`);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const planData = await continueWithBasic({ isOutsideIndia });
      const updatedDoc = {
        ...data,
        isFirstLogin: true,
        createdAt: new Date().toISOString(),
        tokensAvailable: 1000000, // 10 lakh
        tokensUsed: 0,
        currentPlan: planData,
      };
      if (result.displayName) {
        updatedDoc.fullName = result.displayName;
      }
      await setDoc(userRef, updatedDoc);
    } else {
      await updateDoc(userRef, {
        ...data,
      });
    }

    return { success: true, userId: user.uid };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

export const getUser = async (userId) => {
  try {
    const userRef = doc(db, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    const data = { ...userDoc.data(), uid: userDoc.id };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: {} };
  }
};

export const fetchCodeWebsite = async ({ userId, siteId, versionId }) => {
  const ref = doc(db, `users/${userId}/sites/${siteId}/versions/${versionId}`);
  const docs = await getDoc(ref);
  const data = docs.data();
  const code = data.content.code.replace(/```html|```/g, '');
  return code;
};

export const updateCodeWebsite = async ({ userId, siteId, versionId, updatedDoc }) => {
  const ref = doc(db, `users/${userId}/sites/${siteId}/versions/${versionId}`);
  await updateDoc(ref, updatedDoc);
  return { success: true };
};

export const getLastModifiedSite = async ({ userId, order = 'desc' }) => {
  try {
    const siteRef = collection(db, `users/${userId}/sites`);
    const q = query(siteRef, orderBy('updatedAt', order), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'No sites found', data: {} };
    }

    const siteDoc = querySnapshot.docs[0];
    const data = { ...siteDoc.data(), id: siteDoc.id };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: {} };
  }
};

export const getSite = async ({ userId, siteId }) => {
  try {
    const siteRef = doc(db, `users/${userId}/sites/${siteId}`);
    const siteDoc = await getDoc(siteRef);
    const data = { ...siteDoc.data(), id: siteDoc.id };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: {} };
  }
};

export const updateSite = async ({ userId, siteId, updatedDoc }) => {
  try {
    const siteRef = doc(db, `users/${userId}/sites/${siteId}`);
    await updateDoc(siteRef, updatedDoc);
    return { success: true };
  } catch (error) {
    console.log('error ', error);
    return { success: false, error: error.message, data: {} };
  }
};

export const checkIsAnySiteDeleted = async ({ userId }) => {
  try {
    const siteRef = collection(db, `users/${userId}/sites`);
    const baseQuery = query(siteRef, where('status', '==', 'Deleted'));
    const totalSnapshot = await getCountFromServer(baseQuery);
    const totalCount = totalSnapshot.data().count;
    return { success: true, deletedSiteAvailable: !!totalCount };
  } catch (error) {
    console.log('error ', error);
    return { success: false, error: error.message, data: {} };
  }
};

export const getSiteSnapshot = async (
  { userId, page = 1, status = null, itemsPerPage = 12, searchTerm = '', websiteType = null },
  callback,
) => {
  try {
    const siteRef = collection(db, `users/${userId}/sites`);
    // let baseQuery;
    let siteStatus = 'all';
    if (status === 'published') {
      siteStatus = 'Published';
    } else if (status === 'draft') {
      siteStatus = 'Draft';
    } else if (status === 'delete') {
      siteStatus = 'Deleted';
    }

    // Base query to exclude deleted sites
    let baseQuery =
      siteStatus === 'Deleted' ? query(siteRef) : query(siteRef, where('status', '!=', 'Deleted'));

    // Add additional filters to base query
    if (status && searchTerm && websiteType) {
      baseQuery = query(
        baseQuery,
        where('status', '==', siteStatus),
        where('siteName', '>=', searchTerm),
        where('siteName', '<=', searchTerm + '\uf8ff'),
        where('framework', '==', websiteType),
      );
    } else if (status && websiteType) {
      baseQuery = query(
        baseQuery,
        where('status', '==', siteStatus),
        where('framework', '==', websiteType),
      );
    } else if (searchTerm && websiteType) {
      baseQuery = query(
        baseQuery,
        where('siteName', '>=', searchTerm),
        where('siteName', '<=', searchTerm + '\uf8ff'),
        where('framework', '==', websiteType),
      );
    } else if (websiteType) {
      baseQuery = query(baseQuery, where('framework', '==', websiteType));
    } else if (status && searchTerm) {
      baseQuery = query(
        baseQuery,
        where('status', '==', siteStatus),
        where('siteName', '>=', searchTerm),
        where('siteName', '<=', searchTerm + '\uf8ff'),
      );
    } else if (status) {
      baseQuery = query(baseQuery, where('status', '==', siteStatus));
    } else if (searchTerm) {
      baseQuery = query(
        baseQuery,
        where('siteName', '>=', searchTerm),
        where('siteName', '<=', searchTerm + '\uf8ff'),
      );
    }

    // Get total count
    const totalSnapshot = await getCountFromServer(baseQuery);
    const totalCount = totalSnapshot.data().count;

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // Create base query with ordering
    let orderedQuery;
    if (status && searchTerm) {
      orderedQuery = query(baseQuery, orderBy('createdAt', 'desc'));
    } else if (searchTerm) {
      orderedQuery = query(baseQuery, orderBy('createdAt', 'desc'));
    } else {
      orderedQuery = query(baseQuery, orderBy('createdAt', 'desc'));
    }

    // Fetch first page documents to use for pagination
    if (page > 1) {
      // Get the last document from the previous page to use as a cursor
      const prevPageQuery = query(orderedQuery, limit((page - 1) * itemsPerPage));
      const prevPageSnapshot = await getDocs(prevPageQuery);
      const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];

      // Create paginated query with startAfter
      const paginatedQuery = query(orderedQuery, startAfter(lastVisible), limit(itemsPerPage));

      const unsubscribe = onSnapshot(
        paginatedQuery,
        (snapshot) => {
          const sites = [];
          snapshot.forEach((doc) => {
            sites.push({ ...doc.data(), id: doc.id });
          });
          callback({
            success: true,
            data: sites,
            totalCount,
            totalPages,
            currentPage: page,
          });
        },
        (error) => {
          callback({
            success: false,
            error: error.message,
            data: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
          });
        },
      );

      return unsubscribe;
    } else {
      // First page, no need for startAfter
      const paginatedQuery = query(orderedQuery, limit(itemsPerPage));

      const unsubscribe = onSnapshot(
        paginatedQuery,
        (snapshot) => {
          const sites = [];
          snapshot.forEach((doc) => {
            sites.push({ ...doc.data(), id: doc.id });
          });
          callback({
            success: true,
            data: sites,
            totalCount,
            totalPages,
            currentPage: page,
          });
        },
        (error) => {
          callback({
            success: false,
            error: error.message,
            data: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
          });
        },
      );

      return unsubscribe;
    }
  } catch (error) {
    callback({ success: false, error: error.message, data: [] });
    return () => {}; // Return empty cleanup function in case of setup error
  }
};

export const getSeo = async ({ userId, siteId }) => {
  try {
    const collectionRef = collection(db, `seo_analysis/${userId}/sites/${siteId}/analyses`);
    const q = query(collectionRef, orderBy('analyzed_at', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    const data = (querySnapshot.docs.length && querySnapshot.docs[0].data()) || {};

    return data;
  } catch (err) {
    console.log(err);
  }
};

export const getUiAnalysis = async ({ userId, siteId }) => {
  const ref = doc(db, `ResponsiveCheck/${userId}/${siteId}/latest`);
  const docs = await getDoc(ref);
  const data = docs.data();
  return data;
};

export const getLeads = ({ userId, siteId }, callback) => {
  try {
    const leadsRef = collection(db, `users/${userId}/sites/${siteId}/leads`);

    const unsubscribe = onSnapshot(
      leadsRef,
      async (snapshot) => {
        try {
          const totalSnapshot = await getCountFromServer(leadsRef);
          const totalCount = totalSnapshot.data().count;
          callback({ success: true, totalCount });
        } catch (error) {
          callback({ success: false, totalCount: 0, error: ERROR_MSZ.leadsCount });
        }
      },
      (error) => {
        callback({ success: false, totalCount: 0, error: ERROR_MSZ.leadsCount });
      },
    );

    return unsubscribe;
  } catch (error) {
    callback({ success: false, totalCount: 0, error: ERROR_MSZ.leadsCount });
    return () => {}; // Return empty cleanup function in case of setup error
  }
};

// for testing the left hand ui
export const fetchCode = async () => {
  const ref = doc(
    db,
    'users/fmFkIWRFABMUvHdLD8v1RMfkfGN2/sites/cp0QIDRyKUNSR6WBVxbU/versions/053c9f5c-6dc5-4e87-ba28-2fb3ecf1272e',
  );
  const docs = await getDoc(ref);
  const data = docs.data();
  const code = data.content.code.replace(/```html|```/g, '');
  return code;
};

export const fetchSeo = async () => {
  const ref = doc(
    db,
    'seo_analysis/fmFkIWRFABMUvHdLD8v1RMfkfGN2/sites/4AGb5rtCstFHx0HBmZaR/analyses/202503190435234952',
  );
  const docs = await getDoc(ref);
  const data = docs.data();
  return data;
};

export const fetchUiAnalysis = async () => {
  const ref = doc(db, 'ResponsiveCheck/fmFkIWRFABMUvHdLD8v1RMfkfGN2/3Se2M4zt6sg98Gw3Mz0k/latest');
  const docs = await getDoc(ref);
  const data = docs.data();
  return data;
};

export const getPlans = async ({ isOutsideIndia = false }) => {
  try {
    const planPath = isOutsideIndia ? `Plans/Individual/International/Usd` : 'Plans/Individual';
    const botAppUserRef = doc(db, planPath);
    const docSnapshot = await getDoc(botAppUserRef);
    const plans = docSnapshot.data().plans;
    console.log('plans ', plans);
    return { status: 200, plans };
  } catch (error) {
    console.error('Error updatePlans: ', error);
    return { status: 500 };
  }
};

export const updatePlans = async ({ isOutsideIndia = false }) => {
  try {
    const planPath = isOutsideIndia ? 'Plans/Individual/International/Usd' : 'Plans/Individual';
    const botAppUserRef = doc(db, planPath);
    const docSnapshot = await getDoc(botAppUserRef);
    if (docSnapshot.exists()) {
      await updateDoc(botAppUserRef, { plans: isOutsideIndia ? internationalPlans : plans });
    } else {
      await setDoc(botAppUserRef, { plans: isOutsideIndia ? internationalPlans : plans });
    }
    console.log('updated...');
    return { status: 200 };
  } catch (error) {
    console.error('Error updatePlans: ', error);
    return { status: 500 };
  }
};

export const getVersionIds = async ({ userId, siteId }) => {
  try {
    const versionsRef = collection(db, `users/${userId}/sites/${siteId}/versions`);
    const q = query(versionsRef, orderBy('generatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const versionIds = querySnapshot.docs.map((doc) => doc.id);
    return { success: true, data: versionIds };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};
