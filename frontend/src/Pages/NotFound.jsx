import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-5xl font-bold text-slate-900">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-slate-800">Page Not Found</h2>
        <p className="mt-3 text-sm text-slate-500">Sorry, the page you are looking for does not exist.</p>
        <Link to="/dashboard" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
