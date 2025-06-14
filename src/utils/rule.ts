/* eslint-env browser */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

export function checkImages() {
  return Array.from(document.querySelectorAll('img')).map((img) => {
    const style = window.getComputedStyle(img);
    const visible =
      img.offsetParent !== null &&
      style.visibility !== 'hidden' &&
      style.display !== 'none';
    return {
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt'),
      hidden: !visible,
    };
  });
}

export function checkBgImages() {
  return Array.from(document.querySelectorAll('*'))
    .filter((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage && style.backgroundImage !== 'none';
    })
    .map((el) => {
      const style = window.getComputedStyle(el);
      let url = style.backgroundImage;
      const match = url.match(/url\(["']?(.*?)["']?\)/);
      url = match ? match[1] : '';
      let text = (el as HTMLElement).innerText || '';
      if (text.length > 100) text = text.slice(0, 100) + '...';
      const visible =
        el instanceof HTMLElement &&
        el.offsetParent !== null &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';
      return {
        src: url,
        alt: (el as HTMLElement).innerText || null,
        hidden: !visible,
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
