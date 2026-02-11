# 똥피하기 게임 배포 가이드 (Deployment Guide)

이제 게임 데이터(점수)가 **Supabase(클라우드)**에 저장되므로, 복잡한 서버 설정 없이 **무료 정적 웹 호스팅**을 사용할 수 있습니다.

## 1. Vercel 배포 (가장 추천)
Vercel은 GitHub와 연동되어 매우 쉽게 배포할 수 있습니다.

1. [Vercel.com](https://vercel.com)에 가입(GitHub 계정 사용)합니다.
2. 대시보드에서 **Add New...** -> **Project**를 클릭합니다.
3. GitHub 저장소(`first_game`)를 찾아 **Import**를 누릅니다.
4. **Framework Preset**은 `Other`로 둡니다.
5. **Build and Output Settings**는 기본값 그대로 둡니다. (별도 빌드 과정 없음)
6. **Deploy** 버튼을 클릭합니다.
7. 잠시 후 배포가 완료되면 `https://your-project-name.vercel.app` 주소가 생성됩니다.

---

## 2. Netlify 배포 (대안)
Netlify도 Vercel과 비슷하게 가입 후 GitHub 저장소를 연결하면 바로 배포됩니다.

1. [Netlify.com](https://netlify.com) 가입.
2. **Add new site** -> **Import from Git**.
3. GitHub 저장소 선택 후 **Deploy site**.

---

## 3. [중요] Supabase URL 설정 변경
배포가 완료되면, Supabase가 새로운 배포 주소를 승인하도록 설정해야 합니다.

1. **Supabase 대시보드** ([supabase.com](https://supabase.com)) 접속.
2. 왼쪽 메뉴 **Authentication** -> **URL Configuration**.
3. **Site URL**에 방금 생성된 배포 주소(예: `https://poop-game.vercel.app`)를 입력합니다.
4. **Redirect URLs**에도 배포 주소를 추가합니다.
5. **Save**를 누릅니다.

이제 배포된 주소에서 구글 로그인이 정상 작동합니다! 🚀
