# Memora 백엔드 통신 및 데이터 상태 관리 셋업 계획

프론트엔드의 화려한 애니메이션과 디자인이 완성되었으므로, 이제 실제 데이터를 다룰 수 있도록 튼튼한 **Data Fetching Layer**와 **전역 상태 관리(Zustand)** 뼈대를 구축합니다.

## User Review Required

> [!IMPORTANT]
> 백엔드 서버(Spring Boot 또는 FastAPI 추정)의 API 엔드포인트 도메인(Base URL)이 아직 결정되지 않았다면 임시로 `http://localhost:8080/api/v1` 등으로 설정해두고 추후 변경 가능하도록 구성하려 합니다. 이렇게 진행해도 될까요?

---

## 1. Axios 기반 통신 모듈 구축 (Network Layer)
백엔드와의 모든 통신을 중앙 통제하고 토큰(JWT) 관리와 에러 핸들링을 단일화합니다.

### Proposed Changes
#### [NEW] [src/lib/axios.ts](file:///Users/kimdoyeon/Desktop/project/Memora/memora-frontend/src/lib/axios.ts)
- `axios.create()`를 이용한 커스텀 인스턴스(`memoraApi`) 생성.
- **Request Interceptor**: 로컬스토리지 또는 쿠키에 있는 AccessToken을 무조건 Authorization 헤더에 삽입.
- **Response Interceptor**:
  - `401 Unauthorized`: 토큰 만료시 로그아웃 처리 또는 RefreshToken 갱신 로직 (플레이스홀더) 배포.
  - 범용적인 `try-catch` 에러 포맷팅.

---

## 2. Zustand 전역 상태 및 React Query 연동 (State Management)
UI 컴포넌트 내부에서 데이터를 복잡하게 들고 있지 않도록 스토어와 데이터 패칭 훅을 구성합니다.

### Proposed Changes
#### [NEW] [src/lib/store/useAuthStore.ts](file:///Users/kimdoyeon/Desktop/project/Memora/memora-frontend/src/lib/store/useAuthStore.ts)
- 사용자 로그인 정보(`user`: 이름, 이메일, 역할 등)와 인증 여부(`isAuthenticated`)를 전역 보관.
- `login()`, `logout()` 액션 정의.

#### [NEW] [src/components/providers/QueryProvider.tsx](file:///Users/kimdoyeon/Desktop/project/Memora/memora-frontend/src/components/providers/QueryProvider.tsx)
- `@tanstack/react-query`의 `QueryClientProvider` 래퍼(Wrapper) 셋업.
- `Retry` 및 `refetchOnWindowFocus` 옵션 등 기본 설정.

#### [MODIFY] [src/app/layout.tsx](file:///Users/kimdoyeon/Desktop/project/Memora/memora-frontend/src/app/layout.tsx)
- 최상단 `RootLayout`을 방금 만든 `QueryProvider`로 감싸주어 앱 전체에서 React Query 기반의 비동기 호출을 사용할 수 있도록 적용.

---

## 3. Mock API 연동 테스트 준비
실제 백엔드 API가 준비되기 전에도 프론트엔드가 자체적으로 테스트할 수 있는 준비를 갖춥니다.

### Proposed Changes
#### [NEW] [src/lib/api/courses.ts](file:///Users/kimdoyeon/Desktop/project/Memora/memora-frontend/src/lib/api/courses.ts)
- 앞서 작성한 `memoraApi` 인스턴스를 활용하는 도메인별 API 함수 집합 예제 작성 (예: `getCourses()`, `getCourseById()`).

---

## Open Questions

> [!TIP]
> 1. 인증 정보를 유지하기 위해 `localStorage`를 사용하실 계획이신가요, 아니면 Next.js의 특징을 살려 `Server Cookie`를 주로 사용하실 계획이신가요? 본 계획안은 클라이언트 통신을 돕기 위해 **localStorage + Zustand(persist)** 조합을 우선 가정했습니다.

## Verification Plan
1. `QueryProvider` 적용 후 로컬 서버가 터지지 않고 정상 구동되는지 확인.
2. `useAuthStore` 스토어를 강제로 Update하여 `Header`에서 [로그인] 버튼이 유저 이름으로 바뀌는지 임시 확인.
