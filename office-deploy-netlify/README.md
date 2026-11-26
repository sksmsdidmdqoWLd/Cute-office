# 귀여운 2D 가상 사무실 — Netlify 배포용 코드

Tanny의 리뷰팀 가상 사무실을 Netlify에 올려서, 피클도 링크로 열어볼 수 있게 하는 버전이에요.
우편함은 아르센 실제 방 **'배찡이의 소듕한 직원들'** 과 서버 함수(Netlify Functions)로 연결돼요.

Vercel 버전(`office-deploy` 폴더)은 그대로 있어요. 이 폴더는 Netlify용 복사본이에요.
Vercel 버전은 건드리지 않았어요.

## 이게 뭐예요? (7살 설명)

- 지금 사무실은 뮤즈 집 안에 있어요. 그래서 밖에서는 못 열어요.
- 이 코드는 사무실을 **우리 집(Netlify)** 으로 이사시키는 거예요.
- 이사하면 인터넷 주소(링크)가 생겨요. 그 링크를 피클에게 주면 피클도 열 수 있어요.
- 우편함 글은 여전히 진짜 우편함에서 가져와요. 가짜 글이 아니에요.

## 돈이 들어요?

아니요. 전부 무료예요.

- GitHub: 무료
- Netlify Starter(개인용): 무료
- 따로 결제하는 거 없어요. 카드 등록도 안 해요.

## ⚠️ 꼭 읽어주세요: "드래그해서 올리기"는 안 돼요

Netlify에는 파일을 끌어다 놓으면 바로 올려주는 "Netlify Drop"이 있어요.
**이 사무실은 그걸로 안 돼요.** 왜냐하면 우편함을 연결해주는 서버 함수도 같이 올라가야 하거든요.
끌어다 놓기만 하면 화면만 올라가고 우편함 연결이 안 돼요.
반드시 아래 1~3단계를 따라 GitHub에서 가져오는 방법으로 올려요.

## 준비물

- [x] GitHub 가입 완료 (아이디: Tanny의 GitHub 아이디)
- [ ] Netlify 가입 — 아직 안 했으면 아래 0단계부터 해요

## 배포하는 방법 — 하나하나 천천히

### 0단계. Netlify에 가입해요

1. app.netlify.com에 들어가요. (또는 netlify.com에서 Sign up을 눌러요.)
2. **Sign up with GitHub** / **GitHub로 가입하기** 버튼을 눌러요.
3. GitHub 로그인 화면이 뜨면, Tanny의 GitHub 아이디와 비밀번호로 로그인해요.
4. Netlify 화면이 뜨면 끝이에요. 다음 단계로 가요.

> 이메일로 코드를 보내면, 지메일에서 확인해요. 스팸함까지 봐요.

### 1단계. GitHub에 새 집(저장소)을 만들어요

Vercel용 집(`Cute-office`)이랑은 다른 집을 만들어요. 헷갈리지 않게 이름을 다르게 해요.

1. github.com에 들어가요. 로그인된 상태여야 해요.
2. 오른쪽 위에 있는 **+** 버튼을 눌러요.
3. **New repository**를 눌러요.
4. 이름 칸에 이렇게 적어요: `cute-office-netlify`
5. **Public**을 골라요. (Private를 고르면 Netlify가 못 읽어요.)
6. 맨 아래 초록색 **Create repository** 버튼을 눌러요.
7. 화면이 바뀌면 끝이에요. 다음 단계로 가요.

### 2단계. 이 코드를 그 집에 올려요

> 이 단계는 컴퓨터에서 해요. 맥북이 켜져 있을 때 해요.

**쉬운 방법 (웹으로 올리기 — 터미널이 어려우면 이걸로 해요)**

1. 브라우저에서 새 저장소 페이지를 열어요.
   `https://github.com/TANNY_GITHUB_ID/cute-office-netlify`
2. 페이지 가운데 파란 글씨 **uploading an existing file**을 눌러요.
3. 맥북에서 이 폴더(`office-deploy-netlify`)를 열어요. 안에 있는 파일들을 전부 선택해요. (Cmd + A)
4. 선택한 파일들을 브라우저 창으로 끌어다 놔요.
5. 맨 아래 초록색 **Commit changes** 버튼을 눌러요.
6. 파일 목록에 `netlify.toml`이랑 `netlify` 폴더가 보이면 끝이에요.

**터미널로 올리는 방법 (익숙하면 이걸로 해요)**

1. 맥북에서 **터미널**을 열어요. (Cmd + Space 누르고 `Terminal`이라고 치고 Enter)
2. 아래를 한 줄씩 복사해서 붙여넣고 Enter를 눌러요.
   (맨 마지막 줄의 `TANNY_GITHUB_ID` 자리에는 Tanny의 GitHub 아이디를 넣어요.)

```bash
cd ~/workspace/office-deploy-netlify
git init
git add .
git commit -m "귀여운 2D 가상 사무실 Netlify 첫 버전"
git branch -M main
git remote add origin https://github.com/TANNY_GITHUB_ID/cute-office-netlify.git
git push -u origin main
```

3. GitHub 아이디와 비밀번호를 물어보면 입력해요.
   (비밀번호로는 안 되고, GitHub에서 만든 토큰을 넣어야 할 수도 있어요. 그때는 말해줘요.)
4. `done` 같은 말이 뜨면 끝이에요.

### 3단계. Netlify에서 가져와요

1. app.netlify.com에 들어가요. (GitHub로 로그인된 상태)
2. **Add new site** → **Import an existing project**를 눌러요.
3. **GitHub**를 눌러요. (처음이면 GitHub 앱 설치를 물어봐요. **Install**을 누르고, `cute-office-netlify`를 허용해요.)
4. 목록에서 `cute-office-netlify`를 찾아요. 안 보이면 검색 칸에 `cute-office-netlify`라고 쳐요.
5. **Import** 버튼을 눌러요.
6. 아무것도 안 건드려요. 그냥 **Deploy** 버튼을 눌러요.
7. 1~2분 기다려요. "Your site is live" 같은 말이 뜨면 끝이에요.
8. 화면에 나오는 주소(예: `https://cute-office-netlify.netlify.app`)가 바로 사무실 링크예요.
   이 링크를 피클에게 주면 돼요.

### 4단계. 사무실에서 키를 입력해요

링크를 열면 처음에 글이 안 보여요. 키를 넣어야 해요.

1. 사무실 화면 오른쪽 위 **설정** 버튼을 눌러요.
2. **우편함 키** 칸에 배찡이 방 키를 넣어요.
3. **대장(최은지) 전용 키** 칸에 대장 키를 넣어요.
   (이 키로 보낸 글은 최은지 이름으로 올라가요.)
4. **완료**를 눌러요.
5. 회의실 탭을 누르면 진짜 우편함 글이 보여요.

> 키는 내 폰/컴퓨터 브라우저에만 저장돼요. 서버나 코드에는 저장되지 않아요.
> 다른 사람 폰에서 열면, 그 사람도 자기 키를 직접 넣어야 해요.

## 어떻게 돌아가요?

```
폰/컴퓨터 브라우저
   │  (키를 헤더에 담아서)
   ▼
우리 Netlify 서버  /.netlify/functions/mailbox-messages
                   /.netlify/functions/mailbox-send
   │  (서버에서만 아르센 API를 부름 — 브라우저는 직접 못 부름)
   ▼
아르센 우편함  https://mailbox.arsen-ai.com/r/e88O50qtgN9X
```

- 화면 코드는 Vercel 버전과 똑같이 `/api/mailbox/...` 를 불러요.
  `netlify.toml`이 그 주소를 Netlify Functions로 연결해줘요.
- **읽기:** 처음 한 번만 전체를 가져오고(`?since=0`), 그 뒤에는 마지막 글 id로 새 글만 가져와요.
- **쓰기:** Tanny의 글은 무조건 대장 키로 보내요. 대장 키가 없으면 우편함 키로 보내요.
- **실패하면:** 글이 사라지지 않아요. 마지막으로 본 글을 그대로 보여주고, 위에 "재연결 시도 중…"이라고 떠요.
- **우회 헤더:** 서버가 아르센을 부를 때 `X-Mailbox-Key`, `Accept: application/json`,
  `Accept-Encoding: identity`, 브라우저 User-Agent를 항상 같이 보내요.

## 파일이 어떻게 돼 있어요?

```
office-deploy-netlify/
├── package.json            # 필요한 도구 목록 (React, Vite)
├── vite.config.js          # 화면 만드는 도구 설정
├── netlify.toml            # Netlify 설정 (빌드 + 함수 + 주소 연결)
├── index.html              # 첫 화면
├── src/
│   ├── main.jsx            # 시작점
│   ├── App.jsx             # 사무실 + 회의실 + 업무판 + 설정 (전부 여기)
│   └── styles.css          # 귀여운 디자인
├── netlify/
│   └── functions/
│       ├── _shared.cjs      # 헤더·재시도·오류 문구 (공통)
│       ├── mailbox-messages.cjs  # GET  /api/mailbox/messages → 아르센 읽기
│       └── mailbox-send.cjs      # POST /api/mailbox/send     → 아르센 쓰기
└── README.md               # 이 파일
```

Vercel 버전과의 차이점:
- `api/` 폴더 대신 `netlify/functions/` 폴더를 써요. (Netlify 방식이에요.)
- `vercel.json` 대신 `netlify.toml`을 써요.
- 화면 코드(`src/App.jsx`)는 **똑같아요.** 아무것도 안 바꿨어요.

## 업무판은 어떻게 저장돼요? (v1 한계)

- 업무판(업무·체크리스트)은 지금 **각자 브라우저**에만 저장돼요.
- 그래서 Tanny 폰에서 만든 업무가 피클 폰에는 안 보여요.
- 회의실(우편함)은 진짜로 같이 보여요. 업무판까지 같이 보려면 다음 단계에서
  Supabase 같은 무료 데이터베이스를 붙여야 해요.

## Gemini 대화는요?

- 설정에 Gemini API 키를 넣으면, 제미나이 캐릭터를 눌러서 진짜로 대화할 수 있어요.
- 키를 안 넣으면 대화 버튼은 있지만 답을 못 받아요. (자리만 만들어둔 거예요.)
- 키는 브라우저에만 저장되고, Google에만 보내져요.

## 주의할 것

- 우편함 키, 대장 키, Gemini 키를 **절대 코드에 적지 마세요.** 설정 칸에만 입력해요.
- 키를 다른 사람에게 보내지 마세요. 채팅에도 붙여넣지 마세요.
- 이 폴더에 `node_modules`, `dist` 폴더가 생기는데, GitHub에 올릴 필요 없어요.
  (`.gitignore`가 알아서 빼줘요.)
- 참고: `netlify.toml`이랑 `netlify/functions/`는 Vercel용 저장소에도 같이 넣을 수 있어요.
  (Vercel은 `vercel.json`+`api/`를 보고, Netlify는 `netlify.toml`+`netlify/functions/`를 봐요.
  서로 안 건드려요.) 그래서 나중에 한 저장소로 합치고 싶으면 말해줘요.
