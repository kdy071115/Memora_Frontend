# 백엔드 데이터 연동 레이어 셋업 완료 (Option 2)

실제 데이터들이 오고 갈 수 있도록 프로젝트 내부에 단단한 **통신 및 전역 상태 레이어**를 구축했습니다.
향후 백엔드 개발자분께서 API 명세서를 제공해 주실 때마다, 이번에 구축한 인프라 위에 덧붙이기만 하면 됩니다.

## 주요 구축 사항

### 1. `memoraApi` (Axios Interceptor 모듈)
**파일 위치:** `src/lib/axios.ts`
*   모든 서버 요청을 대신 수행하는 커스텀 Axios 인스턴스 설계.
*   요청이 나갈 때마다 백그라운드 스토어(`Zustand`)에서 토큰(Access Token)을 가로채어 자동으로 `Authorization: Bearer ...` 헤더에 삽입하도록 구조화(Interceptor)했습니다.
*   401 에러(만료 권한) 발생 시 토큰 만료 프로세스나 리프레시 로직을 쉽게 끼워 넣을 수 있는 방어 코드를 작성해 두었습니다.

### 2. `useAuthStore` (Zustand Global State)
**파일 위치:** `src/lib/store/useAuthStore.ts`
*   사용자 로그인 상태와 토큰 정보를 프로젝트 전역 어디서든 꺼내어 쓸 수 있는 중앙 저장소입니다.
*   Zustand의 `persist` 미들웨어를 사용하여 `localStorage`와 연동하였으므로, 브라우저 새로고침을 하더라도 로그인 인증(Authentication)이 풀리지 않습니다.

### 3. `@tanstack/react-query` 인프라 적용
**파일 위치:** `src/components/providers/QueryProvider.tsx`, `src/app/layout.tsx`
*   서버에서 가져온 데이터를 프론트엔드 캐시에 매끄럽게 저장하고, 반복적인 요청을 막아 퍼포먼스를 향상시켜줄 `QueryClientProvider`를 구현했습니다.
*   최상위 앱 레이어(`layout.tsx`)에 감싸두어 어떤 페이지를 렌더링하더라도 효율적인 데이터 패칭 훅 사용이 가능해졌습니다.

### 4. `Course` 도메인 Mock API 템플릿 작성
**파일 위치:** `src/lib/api/courses.ts`
*   향후 설계하실 과정을 대비하여 `getCourses()`, `getCourseById()` 같은 비동기 함수 구조(Dummy Promise 반환) 샘플을 작성해 통신 규칙을 제안해 두었습니다. 

---

> [!TIP]
> 이제 프론트엔드의 화면 레이아웃과 데이터 레이어 기초 공사가 모두 완료되었습니다. 백엔드 팀의 API 구축과 통합 테스트 단계로 매끄럽게 넘어가실 수 있습니다!
