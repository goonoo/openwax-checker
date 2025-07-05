/**
 * @jest-environment jsdom
 */
import {
  checkImages,
  checkBgImages,
  checkSkipNav,
  checkPageTitle,
  checkFrames,
  checkHeadings,
  checkInputLabels,
  checkPageLang,
  checkTables,
} from './rule';

describe('5.1.1 적절한 대체 텍스트 제공 (img) 검사: checkImages', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('checkImages: alt 속성이 있는 img는 pass, alt가 없으면 fail, 빈 alt는 warning을 반환해야 한다', () => {
    document.body.innerHTML = `
      <img src="a.jpg" alt="설명" />
      <img src="b.jpg" />
      <img src="c.jpg" alt="" />
    `;
    const results = checkImages();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('fail');
    expect(results[2].valid).toBe('warning');
  });

  it('checkImages: input[type="image"]의 alt 속성 유무에 따라 valid가 올바르게 반환된다', () => {
    document.body.innerHTML = `
      <input type="image" src="btn.png" alt="버튼이미지" />
      <input type="image" src="btn2.png" />
      <input type="image" src="btn3.png" alt="" />
    `;
    const results = checkImages();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('fail');
    expect(results[2].valid).toBe('warning');
  });

  it('checkImages: area 태그의 alt 속성 유무에 따라 valid가 올바르게 반환된다', () => {
    document.body.innerHTML = `
      <map name="mymap">
        <area shape="rect" coords="0,0,82,126" href="#" alt="네이버" />
        <area shape="rect" coords="90,58,3,3" href="#" />
        <area shape="rect" coords="34,45,12,12" href="#" alt="" />
      </map>
    `;
    const results = checkImages();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('fail');
    expect(results[2].valid).toBe('warning');
  });

  it('checkImages: 숨겨진 이미지는 hidden: true로 반환된다', () => {
    document.body.innerHTML = `
      <img id="img1" src="a.jpg" alt="숨김" style="display:none" />
      <img id="img2" src="b.jpg" alt="숨김2" style="visibility:hidden" />
      <img id="img3" src="c.jpg" alt="보임" />
    `;
    // jsdom에서는 offsetParent가 항상 null이므로, 직접 지정해준다
    Object.defineProperty(document.getElementById('img1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('img2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('img3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });

    const results = checkImages();
    expect(results[0].hidden).toBe(true);
    expect(results[1].hidden).toBe(true);
    expect(results[2].hidden).toBe(false);
  });

  it('checkImages: longdesc 속성이 있으면 결과에 포함된다', () => {
    document.body.innerHTML = `
      <img src="a.jpg" alt="desc" longdesc="desc.html" />
      <img src="b.jpg" alt="no-desc" />
    `;
    const results = checkImages();
    expect(results[0].longdesc).toBe('desc.html');
    expect(results[1].longdesc).toBeNull();
  });

  it('checkImages: src가 상대경로/절대경로/없는 경우 모두 절대경로로 반환된다', () => {
    document.body.innerHTML = `
      <img src="/a.jpg" alt="절대" />
      <img src="b.jpg" alt="상대" />
      <img alt="없음" />
    `;
    const results = checkImages();
    expect(results[0].src.startsWith('http')).toBe(true);
    expect(results[1].src.startsWith('http')).toBe(true);
    expect(results[2].src).toBe('http://localhost/'); // jsdom에서는 src가 빈 값이 아니라 http://localhost/ 로 반환된다
  });
});

describe('5.1.1 적절한 대체 텍스트 제공 (bg) 검사: checkBgImages', () => {
  it('checkBgImages: backgroundImage가 있는 요소만 반환한다', () => {
    document.body.innerHTML = `
      <div id="bg1" style="background-image: url('a.jpg')"></div>
      <div id="bg2" style="background-image: none"></div>
      <span id="bg3" style="background-image: url('b.png')"></span>
    `;
    Object.defineProperty(document.getElementById('bg1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    // getComputedStyle mock
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg2')
        return {
          backgroundImage: 'none',
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg3')
        return {
          backgroundImage: "url('b.png')",
          display: 'block',
          visibility: 'visible',
        } as any;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as any;
    });
    const results = checkBgImages();
    expect(results.length).toBe(2);
    expect(results[0].src.endsWith('a.jpg')).toBe(true);
    expect(results[1].src.endsWith('b.png')).toBe(true);
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });

  it('checkBgImages: aria-label, title 속성이 alt로 반환된다', () => {
    document.body.innerHTML = `
      <div id="bg1" style="background-image: url('a.jpg')" aria-label="라벨"></div>
      <div id="bg2" style="background-image: url('b.jpg')" title="타이틀"></div>
      <div id="bg3" style="background-image: url('c.jpg')"></div>
    `;
    Object.defineProperty(document.getElementById('bg1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg3')
        return {
          backgroundImage: "url('c.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as any;
    });
    const results = checkBgImages();
    expect(results[0].alt).toBe('라벨');
    expect(results[1].alt).toBe('타이틀');
    expect(results[2].alt).toBe('');
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });

  it('checkBgImages: 숨겨진 요소는 hidden: true로 반환된다', () => {
    document.body.innerHTML = `
      <div id="bg1" style="background-image: url('a.jpg'); display:none"></div>
      <div id="bg2" style="background-image: url('b.jpg'); visibility:hidden"></div>
      <div id="bg3" style="background-image: url('c.jpg')"></div>
    `;
    Object.defineProperty(document.getElementById('bg1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'none',
          visibility: 'visible',
        } as any;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'hidden',
        } as any;
      if (id === 'bg3')
        return {
          backgroundImage: "url('c.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as any;
    });
    const results = checkBgImages();
    expect(results[0].hidden).toBe(true);
    expect(results[1].hidden).toBe(true);
    expect(results[2].hidden).toBe(false);
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });

  it('checkBgImages: src가 상대경로/절대경로/없는 경우 모두 절대경로로 반환된다', () => {
    document.body.innerHTML = `
      <div id="bg1" style="background-image: url('/a.jpg')"></div>
      <div id="bg2" style="background-image: url('b.jpg')"></div>
      <div id="bg3" style="background-image: url()"></div>
    `;
    Object.defineProperty(document.getElementById('bg1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('/a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg3')
        return {
          backgroundImage: 'url()',
          display: 'block',
          visibility: 'visible',
        } as any;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as any;
    });
    const results = checkBgImages();
    expect(results[0].src.startsWith('http')).toBe(true);
    expect(results[1].src.startsWith('http')).toBe(true);
    expect(results[2].src).toBe('http://localhost/'); // jsdom에서는 src가 빈 값이 아니라 http://localhost/ 로 반환된다
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });
});

describe('5.3.1 표의 구성 검사: checkTables', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('checkTables: caption과 scope 있는 th가 있으면 pass', () => {
    document.body.innerHTML = `
      <table><caption>테이블</caption><thead><tr><th scope="col">헤더</th></tr></thead></table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('pass');
  });
  it('checkTables: caption만 있고 scope 없는 th만 있으면 warning', () => {
    document.body.innerHTML = `
      <table><caption>테이블</caption><thead><tr><th>헤더</th></tr></thead></table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('warning');
  });
  it('checkTables: role이 presentation이면 warning', () => {
    document.body.innerHTML = `
      <table role="presentation"><caption>테이블</caption></table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('warning');
  });
  it('checkTables: caption, summary, scope 있는 th 모두 없으면 warning', () => {
    document.body.innerHTML = `<table><thead><tr><td>데이터</td></tr></thead></table>`;
    const results = checkTables();
    expect(results[0].valid).toBe('warning');
  });
  it('checkTables: 그 외는 fail', () => {
    document.body.innerHTML = `<table><thead><tr><th>헤더</th></tr></thead></table>`;
    const results = checkTables();
    expect(results[0].valid).toBe('fail');
  });
});

describe('6.4.1 반복 영역 건너뛰기 검사: checkSkipNav', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('checkSkipNav: href가 #id로 연결되어 있고, 해당 id가 존재하면 pass, 없으면 fail', () => {
    document.body.innerHTML = `
      <a href="#main">메인 바로가기</a>
      <a href="#content">본문 바로가기</a>
      <a href="#none">없는 곳 바로가기</a>
      <div id="main"></div>
      <div id="content"></div>
    `;
    const results = checkSkipNav();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('pass');
    expect(results[2].valid).toBe('fail');
    expect(results[0].connected).toBe(true);
    expect(results[2].connected).toBe(false);
  });

  it('checkSkipNav: href가 #만 있으면 무조건 fail', () => {
    document.body.innerHTML = `
      <a href="#">잘못된 바로가기</a>
    `;
    const results = checkSkipNav();
    expect(results[0].valid).toBe('fail');
    expect(results[0].connected).toBe(false);
  });

  it('checkSkipNav: href가 #id인데, 해당 id 대신 name 속성이 있는 경우도 pass', () => {
    document.body.innerHTML = `
      <a href="#target">네임 바로가기</a>
      <div name="target"></div>
    `;
    const results = checkSkipNav();
    expect(results[0].valid).toBe('pass');
    expect(results[0].connected).toBe(true);
  });

  it('checkSkipNav: href가 #id가 아닌 경우(null 반환)', () => {
    document.body.innerHTML = `
      <a href="/main">일반 링크</a>
      <a href="javascript:void(0)">JS 링크</a>
      <a>링크 없음</a>
    `;
    const results = checkSkipNav();
    expect(results.length).toBe(0);
  });

  it('checkSkipNav: 20개 초과 링크가 있어도 20개까지만 검사한다', () => {
    let html = '';
    for (let i = 0; i < 25; i++) {
      html += `<a href="#id${i}">${i}번째</a>`;
    }
    for (let i = 0; i < 20; i++) {
      html += `<div id="id${i}"></div>`;
    }
    document.body.innerHTML = html;
    const results = checkSkipNav();
    expect(results.length).toBe(20);
    expect(results.every((r) => r.valid === 'pass')).toBe(true);
  });

  it('checkSkipNav: a 태그에 innerText가 없을 때도 정상적으로 value가 생성된다', () => {
    document.body.innerHTML = `
      <a href="#main"></a>
      <div id="main"></div>
    `;
    const results = checkSkipNav();
    expect(results[0].value).toContain('(#main)');
  });
});

describe('6.4.2 제목 제공 - 페이지 검사: checkPageTitle', () => {
  afterEach(() => {
    document.title = '';
  });
  it('checkPageTitle: title이 있고 중복 특수문자가 없으면 pass', () => {
    document.title = '정상 타이틀';
    const result = checkPageTitle();
    expect(result.valid).toBe('pass');
  });
  it('checkPageTitle: title이 없으면 fail', () => {
    document.title = '';
    const result = checkPageTitle();
    expect(result.valid).toBe('fail');
  });
  it('checkPageTitle: 중복 특수문자가 있으면 fail', () => {
    document.title = '중복::타이틀';
    const result = checkPageTitle();
    expect(result.valid).toBe('fail');
  });
});

describe('6.4.2 제목 제공 - 프레임 검사: checkFrames', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('checkFrames: title이 있는 iframe은 pass, 없으면 fail', () => {
    document.body.innerHTML = `
      <iframe src="a.html" title="프레임"></iframe>
      <iframe src="b.html"></iframe>
    `;
    const results = checkFrames();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('fail');
  });
});

describe('6.4.2 제목 제공 - 콘텐츠 블록 검사: checkHeadings', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('checkHeadings: h1~h6 태그가 모두 반환되고, 항상 pass', () => {
    document.body.innerHTML = `
      <h1>제목1</h1><h2>제목2</h2><h3>제목3</h3><h4>제목4</h4><h5>제목5</h5><h6>제목6</h6>
    `;
    const results = checkHeadings();
    expect(results.length).toBe(6);
    expect(results.every((r) => r.valid === 'pass')).toBe(true);
  });
});

describe('7.1.1 기본 언어 표시 검사: checkPageLang', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('lang');
  });
  it('checkPageLang: lang 속성이 있으면 pass, 없으면 fail', () => {
    document.documentElement.setAttribute('lang', 'ko');
    let results = checkPageLang();
    expect(results[0].valid).toBe('pass');
    document.documentElement.removeAttribute('lang');
    results = checkPageLang();
    expect(results[0].valid).toBe('fail');
  });
});

describe('7.3.2 레이블 제공 검사: checkInputLabels', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('checkInputLabels: label 연결시 pass, title만 있으면 warning, 둘 다 없으면 fail', () => {
    document.body.innerHTML = `
      <label for="a">라벨</label><input id="a">
      <input id="b" title="타이틀">
      <input id="c">
    `;
    const results = checkInputLabels();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('warning');
    expect(results[2].valid).toBe('fail');
  });
  it('checkInputLabels: 부모 label로 연결된 경우도 pass', () => {
    document.body.innerHTML = `<label>부모<input id="d"></label>`;
    const results = checkInputLabels();
    expect(results[0].valid).toBe('pass');
  });
});

