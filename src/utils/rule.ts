/* eslint-env browser */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

export function checkImages() {
  const images = Array.from(document.querySelectorAll('img'));
  const baseUrl = window.location.href;

  return images.map((img) => {
    const src = img.getAttribute('src') || '';
    const absoluteSrc = new URL(src, baseUrl).href;

    const style = window.getComputedStyle(img);
    const visible =
      img.offsetParent !== null &&
      style.visibility !== 'hidden' &&
      style.display !== 'none';
    return {
      hidden: !visible,
      src: absoluteSrc,
      alt: img.getAttribute('alt'),
    };
  });
}

export function checkBgImages() {
  const elements = Array.from(document.querySelectorAll('*'));
  const baseUrl = window.location.href;

  function isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.getBoundingClientRect().height > 0
    );
  }

  return elements
    .filter((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage !== 'none';
    })
    .map((el) => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      const urlMatch = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
      const src = urlMatch ? urlMatch[1] : '';
      const absoluteSrc = new URL(src, baseUrl).href;

      return {
        hidden: !isVisible(el),
        src: absoluteSrc,
        alt: el.getAttribute('aria-label') || el.getAttribute('title') || '',
      };
    });
}

export function checkSkipNav() {
  return Array.from([...document.querySelectorAll('a')].slice(0, 20))
    .map((a, index) => {
      if (!a.getAttribute('href')?.startsWith('#')) return null;
      const href = a.getAttribute('href');
      const isConnectedLink =
        href === '#'
          ? false
          : !!document.getElementById(href.replace('#', '')) ||
            document.getElementsByName(href.replace('#', '')).length > 0;
      return {
        label: index + 1 + '번째 링크',
        value: '(' + href + ') ' + a.innerText,
        connected: isConnectedLink,
      };
    })
    .filter((item) => item !== null);
}

export function checkPageTitle() {
  const title = document.title || '';
  const dupCharacters = [
    '::',
    '||',
    '--',
    '@@',
    '##',
    '$$',
    '%%',
    '&&',
    '**',
    '((',
    '))',
    '++',
    '==',
    '~~',
    ';;',
    '<<',
    '>>',
    '[[',
    ']]',
    '★★',
    '☆☆',
    '◎◎',
    '●●',
    '◆◆',
    '◇◇',
    '□□',
    '■■',
    '△△',
    '▲▲',
    '▽▽',
    '▼▼',
    '◁◁',
    '◀◀',
    '▷▷',
    '▶▶',
    '♠♠',
    '♤♤',
    '♡♡',
    '♥♥',
    '♧♧',
    '♣♣',
    '⊙⊙',
    '◈◈',
    '▣▣',
    '◐◐',
    '◑◑',
    '▒▒',
    '▤▤',
    '▥▥',
    '▨▨',
    '▧▧',
    '▦▦',
    '▩▩',
    '♨♨',
    '☏☏',
    '☎☎',
  ];
  const hasTitle = !!title;
  const hasSpecialCharactersDup = false;
  for (let i = 0; i < dupCharacters.length; i++) {
    if (title.indexOf(dupCharacters[i]) > -1) {
      hasSpecialCharactersDup = true;
      break;
    }
  }

  return {
    title,
    correct: hasTitle && !hasSpecialCharactersDup,
  };
}

export function checkFrames() {
  function getAllFrames(doc: Document): HTMLIFrameElement[] {
    const frames = Array.from(doc.querySelectorAll('iframe'));
    const nestedFrames = frames.flatMap((frame) => {
      try {
        const frameDoc = frame.contentDocument || frame.contentWindow?.document;
        return frameDoc ? getAllFrames(frameDoc) : [];
      } catch {
        // cross-origin iframe은 접근할 수 없으므로 무시
        return [];
      }
    });
    return [...frames, ...nestedFrames];
  }

  return getAllFrames(document).map((frame) => {
    const style = window.getComputedStyle(frame);
    const visible =
      frame.offsetParent !== null &&
      style.visibility !== 'hidden' &&
      style.display !== 'none';
    return {
      label: 'iframe',
      value: frame.getAttribute('title') || '',
      contents: frame.getAttribute('src') || '',
      validate: !!frame.getAttribute('title'),
      hidden: !visible,
    };
  });
}

export function checkHeadings() {
  return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
    (heading) => {
      const style = window.getComputedStyle(heading);
      const visible =
        heading.offsetParent !== null &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';
      return {
        label: 'heading',
        value: heading.tagName.toLowerCase(),
        contents: heading.textContent?.trim() || '',
        validate: true,
        hidden: !visible,
      };
    },
  );
}

export function checkInputLabels() {
  const inputs = Array.from(
    document.querySelectorAll(
      'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]), textarea',
    ),
  );

  function isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.getBoundingClientRect().height > 0
    );
  }

  const results = inputs.map((input) => {
    const isHidden = !isVisible(input);
    const element = input.tagName.toLowerCase();
    const type = input.getAttribute('type') || 'text';
    const title = input.getAttribute('title') || '';

    // label 연결 확인
    let hasLabel = false;
    let hasTitle = false;

    // 1. 연결된 label 확인
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        hasLabel = true;
      }
    }

    // 2. 부모 label 확인
    if (!hasLabel) {
      const parentLabel = input.closest('label');
      if (parentLabel) {
        hasLabel = true;
      }
    }

    // 3. title 속성 확인
    if (title) {
      hasTitle = true;
    }

    return {
      hidden: isHidden,
      element,
      type,
      valid: hasLabel || hasTitle,
      title: title,
      hasLabel,
      hasTitle,
    };
  });

  return {
    label: '입력 필드 라벨',
    value: results.length,
    contents: results,
    validate: results.every((r) => r.valid),
    hidden: results.every((r) => r.hidden),
  };
}
