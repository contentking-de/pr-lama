export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">E-Mail prüfen</h1>
        <p className="text-gray-600 mb-4">
          Wir haben dir einen Magic Link per E-Mail gesendet.
        </p>
        <p className="text-sm text-gray-500">
          Bitte klicke auf den Link in der E-Mail, um dich anzumelden.
        </p>
      </div>
    </div>
  )
}

