export default class Utils {
  static isMobile() {
    return /android|avantgo|blackberry|iemobile|ipad|iphone|ipod|opera mini|palm|phone|windows phone|mobile/i.test(navigator.userAgent || window.opera);
  }

  static isInStandaloneMode() {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true
    );
  }

  static detectPlatform() {
    try {
      const nav = navigator;
      if (nav.userAgentData && Array.isArray(nav.userAgentData.brands)) {
        const uaBrands = nav.userAgentData.brands.map(b => b.brand + '/' + b.version).join(' ');
        const ua = (uaBrands + ' ' + (nav.platform || '')).toLowerCase();
        if (/android/.test(ua)) return 'android';
        if (/iphone|ipad|ipod|ios|macintosh/.test(ua)) return 'ios';
        if (/huawei|honor|harmony|hmscore/.test(ua)) return 'huawei';
      }
    } catch (e) { }
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent || '').toLowerCase();
    const platform = (typeof navigator !== 'undefined' && navigator.platform || '').toLowerCase();
    
    if (/android/.test(ua) || /android/.test(platform)) return 'android';
    if (/iphone|ipod/.test(ua)) return 'ios';
    if (/macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document) return 'ios';
    if (/ipad/.test(ua)) return 'ios';
    if (/huawei|honor|harmony|hmscore/.test(ua)) return 'huawei';
    return 'unknown';
  }
}
