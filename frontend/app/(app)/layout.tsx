import NavBar from "@/components/layout/navbar";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>
    <NavBar />
  {children}
  </>;
}