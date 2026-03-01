// // lib/useImages.ts
// import { useEffect, useRef, useState } from 'react';
// import { LOGO_B64, SIG_B64 } from './assets';

// export interface Images {
//   logoImg: HTMLImageElement | null;
//   sigImg: HTMLImageElement | null;
//   ready: boolean;
// }

// export function useImages(): Images {
//   const [ready, setReady] = useState(false);
//   const logoRef = useRef<HTMLImageElement | null>(null);
//   const sigRef  = useRef<HTMLImageElement | null>(null);

//   useEffect(() => {
//     let mounted = true;

//     function loadOne(src: string): Promise<HTMLImageElement> {
//       return new Promise((resolve, reject) => {
//         const img = new Image();
//         img.onload = () => resolve(img);
//         img.onerror = () => reject(new Error(`Failed to load: ${src.slice(0, 30)}`));
//         img.src = src;
//       });
//     }

//     Promise.all([
//       loadOne(`data:image/x-icon;base64,${LOGO_B64}`),
//       loadOne(`data:image/png;base64,${SIG_B64}`),
//     ])
//       .then(([logo, sig]) => {
//         if (!mounted) return;
//         logoRef.current = logo;
//         sigRef.current  = sig;
//         setReady(true);
//       })
//       .catch((err) => {
//         console.error('Image load error:', err);
//         if (mounted) setReady(true); // continue even if one fails
//       });

//     return () => { mounted = false; };
//   }, []);

//   return { logoImg: logoRef.current, sigImg: sigRef.current, ready };
// }
// lib/useImages.ts
import { useEffect, useState } from 'react';
import { LOGO_B64, SIG_B64 } from './assets';

export interface Images {
  logoImg: HTMLImageElement | null;
  sigImg: HTMLImageElement | null;
  ready: boolean;
}

export function useImages(): Images {
  const [state, setState] = useState<Images>({
    logoImg: null,
    sigImg: null,
    ready: false,
  });

  useEffect(() => {
    let mounted = true;

    function loadOne(src: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed: ${src.slice(0, 40)}`));
        img.src = src;
      });
    }

    Promise.all([
      loadOne(`data:image/x-icon;base64,${LOGO_B64}`),
      loadOne(`data:image/png;base64,${SIG_B64}`),
    ])
      .then(([logoImg, sigImg]) => {
        if (!mounted) return;
        // Store in state → triggers re-render → canvas draws with real images
        setState({ logoImg, sigImg, ready: true });
      })
      .catch((err) => {
        console.error('Image load error:', err);
        if (mounted) setState(s => ({ ...s, ready: true }));
      });

    return () => { mounted = false; };
  }, []);

  return state;
}
