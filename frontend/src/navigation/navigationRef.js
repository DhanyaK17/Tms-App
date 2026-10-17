import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    // If navigation container is not ready, retry in 200ms
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
      }
    }, 200);
  }
}

export default {
  navigationRef,
  navigate,
};
