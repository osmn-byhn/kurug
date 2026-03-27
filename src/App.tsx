import AppRoutes from './routes'
import Titlebar from './components/layouts/Titlebar'
import './App.css'

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#16171d] text-[#f3f4f6]">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-8 bg-[#16171d]">
          <AppRoutes />
        </main>
      </div>
    </div>
  )
}

export default App
