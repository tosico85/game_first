# 똥피하기 게임 배포 가이드 (Deployment Guide)

이제 게임 데이터(점수)가 **Supabase(클라우드)**에 저장되므로, 복잡한 서버 설정 없이 **무료 정적 웹 호스팅**을 사용할 수 있습니다.

## 1. Vercel 배포 (권장)

Vercel을 통해 매우 쉽게 배포할 수 있습니다. `vercel.json` 설정이 이미 완료되어 있습니다.

### 방법 A: Vercel CLI 사용 (가장 빠름)
터미널에서 다음 명령어를 순서대로 입력하세요:

1.  `npx vercel login` (이메일 인증 등으로 로그인)
2.  `npx vercel` (배포 시작)
    *   질문이 나오면 모두 기본값(Enter)을 선택하면 됩니다.
3.  배포가 완료되면 `Production: https://...` 주소가 나옵니다.

### 방법 B: GitHub 연동
1. [Vercel.com](https://vercel.com)에 로그인.
2. **Add New...** -> **Project**.
3. GitHub 저장소(`first_game`) Import.
4. **Deploy** 클릭.

---

## 2. [필수] Supabase URL 설정 변경
배포 후, Supabase가 새 주소를 승인해야 로그인이 작동합니다.

---

## 3. [중요] Supabase URL 설정 변경
배포가 완료되면, Supabase가 새로운 배포 주소를 승인하도록 설정해야 합니다.

1. **Supabase 대시보드** ([supabase.com](https://supabase.com)) 접속.
2. 왼쪽 메뉴 **Authentication** -> **URL Configuration**.
3. **Site URL**에 방금 생성된 배포 주소(예: `https://poop-game.vercel.app`)를 입력합니다.
4. **Redirect URLs**에도 배포 주소를 추가합니다.
5. **Save**를 누릅니다.

이제 배포된 주소에서 구글 로그인이 정상 작동합니다! 🚀
