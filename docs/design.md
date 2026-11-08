# Community – 디자인 분석

Figma: [Community](https://www.figma.com/design/4a9az05FHDuf5tkGwOmeaL/Community?node-id=0-1)
분석 대상: 모바일 커뮤니티(피드/SNS) 앱 · iOS 기준 390 × 844

> ⚠️ Figma MCP 무료 플랜 호출 한도로 인해 일부 정확한 hex/토큰 값은 스크린샷과 확보된 변수 정의에서 추론했습니다. 정밀 토큰이 필요하면 Color 섹션(node `7:10536`)의 `get_variable_defs`를 재확인하세요.

---

## 1. 화면 구조 (Screens)

기준 프레임: **390 × 844** (iPhone), 세이프에어리어 상단 StatusBar 44 / 하단 34.

플로우는 크게 **인증 → 피드 → 프로필 → 설정** 네 갈래로 나뉩니다.

### 인증 (Auth Flow)
| 화면 | Node | 구성 |
|------|------|------|
| SplashScreen | `7:10637` | StatusBar + 중앙 로고(112×112) |
| AuthHome | `7:10640` | 로고 + Filled/Large CTA + "이메일로 가입하기" |
| Signup | `7:10645` | Header + 이메일/비밀번호/비밀번호 확인 입력 + 하단 고정 CTA |
| Login | `7:10655` | Header + 이메일/비밀번호 입력 + 하단 고정 CTA |

### 피드 (Feed Flow)
| 화면 | Node | 구성 |
|------|------|------|
| Home | `7:10596` | 상단 검색바 + FeedItem 리스트 + WriteButton(FAB) + BottomTab |
| Feed/Detail | `7:10754` | FeedItem + 댓글 리스트 + 하단 댓글 입력창 |
| Feed/Write | `7:10665` | Header("저장") + 제목/본문 입력 + 이미지 첨부 썸네일 |
| Feed/Search | `7:10956` | 검색 입력 + 결과 FeedItem + 키보드 |

### 프로필 / 설정 (Profile & Setting Flow)
| 화면 | Node | 구성 |
|------|------|------|
| My (내 프로필) | `7:10698` | 프로필 영역 + 내 FeedItem 리스트 + BottomTab |
| Profile/[id] | `7:10711` | 커버 이미지 + 아바타(152) + 팔로우 + Tabs + FeedItem |
| Profile/Update | `7:10723` | 아바타 + "사진 변경" + 소개 입력 + 하단 고정 CTA |
| Setting | `7:10630` | Header + ListItem(로그아웃 등) + BottomTab |

**하단 탭(BottomTab)**: 홈 / 내 프로필 / 설정 (3-tab), 활성 탭은 오렌지 강조.

---

## 2. 주요 컴포넌트 (Components)

Figma에서 섹션 단위로 정리된 디자인 시스템입니다.

### Button (`7:10252`)
- **Variant 3종 × Size 3종**: Standard / Filled / Outlined × Small / Medium / Large
- 각 버튼은 Default / Disabled 상태 보유
- **Icon 버튼**: Like, Comment, Share, Cancel, Reply, Camera, Vote, Setting, Eye(outline), User
- **WriteButton** (`7:10319`): 64×64 원형 FAB (연필 아이콘, 오렌지)
- **FixedBottomCTA** (`7:10322`): 390×90 하단 고정 버튼 영역

### Navigation (`7:10391`)
- **StatusBar** 44 / **BottomTab** 390×82 / **SafeArea/Bottom** 34
- **Header** 4종: CustomHeader, CustomHeader/Black, TwoButton, Default (높이 56~59)
- **Tabs**: 2/3/4개 세그먼트 (높이 38)

### Input (`7:10497`)
- **Filled** (기본): SingleLine 44 / MultiLine 85 / Label형 68 / Error형 92
- **Outlined** / **Standard**: Default + Icon
- **Search** (`7:10525`): 306×44 검색 입력 (돋보기 아이콘)

### Feed (`7:10767`) — 핵심 도메인 컴포넌트
- **FeedItem** (`7:10782`): FeedHeader(아바타+이름+시간+⋮) / Basic(본문) / SinglePicture / MultiplePicture
- **Action** (`7:10772`): Like / Comment / Eye(조회수) — 아이콘 + 카운트 (47×24)
- **Picture** (`7:10768`): 썸네일 90×90
- **Comment** (`7:10836`): CommentHeader / CommentInput / Enroll / Default
- **Profile** (`7:10858`): Avatar(45), CommentItemProfile, FeedItemProfile, Follow(True/False), ProfileDetail
- **FeedWrite** (`7:10900`): 이미지 첨부 Footer

### Setting (`7:10530`)
- **ListItem** (390×40) / **ActionSheet** (365×134)

### Asset (`7:10576`)
- **logo** 112×112 · **default-avatar** 229×229 (곰 캐릭터 아바타)

---

## 3. 색상 (Color)

Color 섹션(`7:10536`)에 3개 팔레트가 정의됨. 오렌지가 **주 강조색(Primary/Accent)**, 그레이스케일이 배경/텍스트, 레드가 위험/에러.

### Primary — Orange (`7:10562`)
스텝: 100 / 200 / 300 / 600
- WriteButton(FAB), 활성 좋아요(하트), 활성 하단 탭, 강조 CTA에 사용
- 화면 기준 코랄톤 오렌지 (약 `#FF6B4A` 계열, 정확값은 변수 재확인 필요)

### Neutral — Gray / Greyscale (`7:10537`)
스텝: 100 / 200 / 300 / 500 / 600 / 700
- 확인된 토큰: `greyscale/Grey 92 = #DFE2E8` (구분선/카드 밴드), `slate/800 = #1e293b`
- `main/dark = #232323 / #000000` (본문 텍스트·다크 헤더)
- 용도: 본문 텍스트(다크), 보조 텍스트/플레이스홀더(미드 그레이), 배경 밴드/디바이더(라이트 그레이)

### Danger — Red (`7:10571`)
스텝: 100 / 500 — 에러 인풋, 삭제/경고 액션

---

## 4. 타이포그래피 (Typography)

- **Font family: Poppins**
- 확인된 스타일: `body/Small/regular` = Poppins Regular **14 / lineHeight 1.6 / letterSpacing 0**
- 위계: 이름(볼드) > 본문 14 > 보조 정보(시간/카운트, 그레이)
- 한글 본문이 섞여 사용됨 (실제 앱에서는 한글 폰트 fallback 필요)

---

## 5. 간격 · 레이아웃 톤 (Spacing & Layout)

전반적으로 **여백이 넉넉하고 카드 사이를 옅은 그레이 밴드로 구분**하는 깔끔한 SNS 톤.

| 항목 | 값 |
|------|-----|
| 프레임 폭 | 390 |
| 좌우 콘텐츠 패딩 | **16** (FeedItem/입력 x=16 기준) |
| StatusBar 높이 | 44 |
| Header 높이 | 56–59 |
| BottomTab 높이 | 82 |
| SafeArea 하단 | 34 |
| FeedItem 높이 | ~361 (이미지 포함) |
| 아바타(피드) | 45 · (프로필) 152 |
| 인풋 높이 | 44 (단일) / 68 (라벨형) |
| FAB(WriteButton) | 64 × 64 (우하단, 하단 탭 위) |
| 이미지 썸네일 | 90 × 90 |
| 액션 아이콘 | 24 · 카운트 라벨 47×24 |

### 레이아웃 특징
- **모서리 둥근 요소**: 아바타(원형), 이미지 썸네일(라운드), FAB(완전 원형)
- **구분**: 카드 간 옅은 그레이(`#DFE2E8`) 밴드/디바이더로 분리 (강한 보더 없음)
- **강조 규칙**: 인터랙션·활성 상태에만 오렌지 사용, 나머지는 무채색 유지 → 저채도 + 포인트 컬러 전략
- **하단 고정 패턴**: FixedBottomCTA(폼) / BottomTab(내비) / 댓글 입력창(디테일)이 하단에 고정

---

## 6. 구현 참고

- **플랫폼**: 모바일 우선 (390 폭 = iOS 논리 해상도). React Native 또는 반응형 웹앱 적합.
- **디자인 시스템 존재**: Button/Input/Navigation/Feed 컴포넌트가 variant로 체계화되어 있어 재사용 컴포넌트로 1:1 매핑 권장.
- **컬러 토큰화**: Orange(primary) / Gray(neutral) / Red(danger)를 시맨틱 토큰(`primary`, `text`, `muted`, `border`, `danger`)으로 추상화하면 유지보수 용이.
- **핵심 화면 우선순위**: Home(피드) → Feed/Detail → Feed/Write → Auth → Profile → Setting.
