/* eslint-env browser */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

export function checkImages() {
  const images = Array.from(
    document.querySelectorAll('img, input[type="image"], area'),
  );
  const baseUrl = window.location.href;

  return images.map((img) => {
    const src = img.getAttribute('src') || '';
    let absoluteSrc = '';
    try {
      absoluteSrc = new URL(src, baseUrl).href;
    } catch {
      absoluteSrc = src;
    }

    const style = window.getComputedStyle(img);
    const visible =
      img.offsetParent !== null &&
      style.visibility !== 'hidden' &&
      style.display !== 'none';
    const valid =
      img.getAttribute('alt') === ''
        ? 'warning'
        : img.getAttribute('alt') === null
          ? 'fail'
          : 'pass';
    return {
      hidden: !visible,
      src: absoluteSrc,
      alt: img.getAttribute('alt'),
      valid,
    };
  });
}

export function checkBgImages() {
  const elements = Array.from(document.querySelectorAll('*'));
  const baseUrl = window.location.href;

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
      let absoluteSrc = '';
      try {
        absoluteSrc = new URL(src, baseUrl).href;
      } catch {
        absoluteSrc = src;
      }
      const visible =
        el.offsetParent !== null &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';
      const valid = 'unknown';

      return {
        hidden: !visible,
        src: absoluteSrc,
        alt: el.getAttribute('aria-label') || el.getAttribute('title') || '',
        valid,
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
      const valid = isConnectedLink ? 'pass' : 'fail';
      return {
        label: index + 1 + '번째 링크',
        value: '(' + href + ') ' + a.innerText,
        connected: isConnectedLink,
        valid,
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
    valid: hasTitle && !hasSpecialCharactersDup ? 'pass' : 'fail',
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
      valid: frame.getAttribute('title') ? 'pass' : 'fail',
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
        valid: 'pass',
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

  return inputs.map((input) => {
    const isHidden = !isVisible(input);
    const element = input.tagName.toLowerCase();
    const type = input.getAttribute('type') || 'text';
    const title = input.getAttribute('title') || '';
    let label = '';

    // label 연결 확인
    let hasLabel = false;
    let hasTitle = false;

    // 1. 연결된 label 확인
    if (input.id) {
      const labelElement = document.querySelector(`label[for="${input.id}"]`);
      if (labelElement) {
        hasLabel = true;
        label = labelElement.textContent || '';
      }
    }

    // 2. 부모 label 확인
    if (!hasLabel) {
      const parentLabel = input.closest('label');
      if (parentLabel) {
        hasLabel = true;
        label = parentLabel.textContent || '';
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
      label,
      valid: hasLabel ? 'pass' : hasTitle ? 'warning' : 'fail',
      title: title,
      hasLabel,
      hasTitle,
    };
  });
}

export function checkPageLang() {
  function getAllFrameDocuments(doc: Document): Document[] {
    const frames = Array.from(doc.querySelectorAll('iframe'));
    const nestedFrameDocuments = frames.flatMap((frame) => {
      try {
        const frameDoc = frame.contentDocument || frame.contentWindow?.document;
        return frameDoc ? getAllFrameDocuments(frameDoc) : [];
      } catch {
        // cross-origin iframe은 접근할 수 없으므로 무시
        return [];
      }
    });
    return [doc, ...nestedFrameDocuments];
  }

  return getAllFrameDocuments(document)
    .map((doc) => {
      try {
        const html = doc.documentElement;
        const lang = html?.getAttribute('lang') || '';
        const url = doc.location.href || '';
        const valid = lang ? 'pass' : 'fail';
        return {
          lang: lang || '',
          url,
          valid,
        };
      } catch {
        return null;
      }
    })
    .filter((item) => item !== null);
}

export function checkTables() {
  return Array.from(document.querySelectorAll('table')).map((table) => {
    const caption = table.querySelector('caption')?.textContent?.trim() || '';
    const summary = table.getAttribute('summary') || '';
    const thead = table.querySelector('thead');
    const tfoot = table.querySelector('tfoot');
    const tbody = table.querySelector('tbody');
    const role = table.getAttribute('role');

    function extractCells(section) {
      if (!section) return [];
      return Array.from(section.querySelectorAll('tr')).map((tr) => {
        return Array.from(tr.children).map((cell) => {
          return {
            tag: cell.tagName.toLowerCase(),
            text: cell.textContent?.trim() || '',
            scope: cell.getAttribute('scope') || '',
          };
        });
      });
    }

    // valid 판정 로직
    let valid = 'fail';
    if (role === 'presentation') {
      valid = 'warning';
    } else {
      // thead, tbody, tfoot 전체에서 scope 있는 th가 하나라도 있으면 pass
      const allCells = [
        extractCells(thead),
        extractCells(tbody),
        extractCells(tfoot),
      ].flat(2);
      const hasScopeTh = allCells.some(
        (cell) => cell.tag === 'th' && cell.scope,
      );
      if (caption && hasScopeTh) {
        valid = 'pass';
      }
    }

    return {
      caption,
      summary,
      thead: !!thead,
      tfoot: !!tfoot,
      tbody: !!tbody,
      theadCells: extractCells(thead),
      tfootCells: extractCells(tfoot),
      tbodyCells: extractCells(tbody),
      valid,
    };
  });
}
