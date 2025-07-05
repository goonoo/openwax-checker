/* eslint-env browser */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * 5.1.1 적절한 대체 텍스트 제공 (img) 검사
 */
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
      longdesc: img.getAttribute('longdesc'),
      valid,
    };
  });
}

/**
 * 5.1.1 적절한 대체 텍스트 제공 (bg) 검사
 */
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

/**
 * 5.3.1 표의 구성 검사
 */
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
      // thead, tbody, tfoot 전체에서 scope 있는 th가 하나라도 있고, caption이 있어야 pass
      const allCells = [
        extractCells(thead),
        extractCells(tbody),
        extractCells(tfoot),
      ].flat(2);
      const hasTh = allCells.some((cell) => cell.tag === 'th');
      const hasScopeTh = allCells.some(
        (cell) => cell.tag === 'th' && cell.scope,
      );
      if (caption && hasScopeTh) {
        valid = 'pass';
      } else if (caption && hasTh) {
        valid = 'warning';
      } else if (!caption && !summary && !hasTh) {
        // caption이 없고, summary도 없고, scope 있는 th도 없으면 레이아웃 테이블로 간주하여 warning
        valid = 'warning';
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

/**
 * 6.4.1 반복 영역 건너뛰기 검사
 */
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

/**
 * 6.4.2 제목 제공 - 페이지 검사
 */
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
  let hasSpecialCharactersDup = false;
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

/**
 * 6.4.2 제목 제공 - 프레임 검사
 */
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

/**
 * 6.4.2 제목 제공 - 콘텐츠 블록 검사
 */
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

/**
 * 7.1.1 기본 언어 표시 검사
 */
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
        const isXhtml = html?.getAttribute('xmlns') === 'http://www.w3.org/1999/xhtml';
        const lang = html?.getAttribute('lang') || '';
        const xmlLang = html?.getAttribute('xml:lang') || '';
        const url = doc.location.href || '';

        let valid = 'fail';
        let value = '';
        if (isXhtml && xmlLang && lang) {
          valid = 'pass';
          value = 'xml:lang=' + xmlLang + ', lang=' + lang;
        } else if (isXhtml && xmlLang) {
          valid = 'warning';
          value = 'xml:lang=' + xmlLang;
        } else if (lang) {
          valid = 'pass';
          value = 'lang=' + lang;
        }

        return {
          lang: lang || '',
          url,
          valid,
          value,
        };
      } catch {
        return null;
      }
    })
    .filter((item) => item !== null);
}

/**
 * 7.3.2 레이블 제공 검사
 */
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
