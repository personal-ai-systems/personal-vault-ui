import FileBrowser from "@/components/FileBrowser";
import Sidebar from "@/components/Sidebar";
import TopAppBar from "@/components/TopAppBar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function Home() {
  return (
    <>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <FileBrowser />
          </main>
        </div>
      </div>
      <PWAInstallPrompt />
    </>
  );
}
