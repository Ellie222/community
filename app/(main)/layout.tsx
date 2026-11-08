import BottomTab from "@/app/components/BottomTab";

// 로그인 이후 화면(홈/내정보/설정)용 레이아웃.
// 모바일 컨테이너는 루트 레이아웃이 담당하고, 여기서는 하단 탭바만 얹는다.
// (auth) 그룹의 회원가입/로그인 화면에는 탭바가 붙지 않는다.
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <BottomTab />
    </>
  );
}
