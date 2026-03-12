import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = '500835206658-1flbb7vnoe6c7d2o0kcth705nhsvjtol.apps.googleusercontent.com';

let configured = false;

export const ensureGoogleSignInConfigured = () => {
  if (configured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  configured = true;
};

export const signInWithGoogle = async () => {
  ensureGoogleSignInConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (isSuccessResponse(response)) {
    return response.data.user;
  }

  return null;
};

export const getGoogleSignInErrorMessage = (error) => {
  if (!isErrorWithCode(error)) {
    return 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้';
  }

  switch (error.code) {
    case statusCodes.SIGN_IN_CANCELLED:
      return 'ยกเลิกการเข้าสู่ระบบด้วย Google';
    case statusCodes.IN_PROGRESS:
      return 'Google Sign-In กำลังทำงานอยู่';
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return 'อุปกรณ์นี้ไม่มี Google Play Services ที่พร้อมใช้งาน';
    default:
      return error.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้';
  }
};
