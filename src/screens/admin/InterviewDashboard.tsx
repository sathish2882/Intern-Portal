import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import AdminPortalShell from '../../components/layout/AdminPortalShell'
import { getExamSummaryApi, resetExamDataApi } from '../../services/authApi'
import { Button } from 'antd'
import { downloadExcel } from '../../utils/download'

interface ExamUser {
  user_id: number
  username: string
  name: string
  email: string
  aptitude_score: number
  aptitude_percentage: number
  technical_score: number
  technical_percentage: number
  total_score: number
  total_percentage: number
  result: string
}

const STATUS_CLASSES: Record<string, string> = {
  PASS: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20',
  FAIL: 'bg-red-500/15 text-red-300 border border-red-400/20',
}

const InterviewDashboard = () => {
  const [data, setData] = useState<ExamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getExamSummaryApi()
        const payload = response?.data ?? []
        setData(Array.isArray(payload) ? payload : [])
      } catch (error: any) {
        console.error(error)
        toast.error(error?.response?.data?.detail || 'Failed to load exam summary')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  

  const totalUsers = data.length
  const passCount = data.filter((u) => u.result === 'PASS').length
  const avgAptitude = totalUsers > 0 ? (data.reduce((s, u) => s + u.aptitude_percentage, 0) / totalUsers).toFixed(1) : '0'
  const avgTechnical = totalUsers > 0 ? (data.reduce((s, u) => s + u.technical_percentage, 0) / totalUsers).toFixed(1) : '0'
  const topScore = totalUsers > 0 ? Math.max(...data.map((u) => u.total_score)) : 0

  const stats = [
    { label: 'Total Evaluated', value: totalUsers, hint: 'All submitted assessments', valueClass: 'text-amber-300' },
    { label: 'Aptitude Avg', value: `${avgAptitude}%`, hint: 'Average aptitude score', valueClass: 'text-sky-300' },
    { label: 'Technical Avg', value: `${avgTechnical}%`, hint: 'Average technical score', valueClass: 'text-emerald-300' },
    { label: 'Top Score', value: `${topScore}/50`, hint: `${passCount} passed out of ${totalUsers}`, valueClass: 'text-amber-300' },
  ]

  const handleResetExam = async () => {
    const confirmed = window.confirm('Are you sure you want to reset all exam data? This action cannot be undone.')
    if (!confirmed) return

    try {
      setResetting(true)
      await resetExamDataApi()
      toast.success('Exam data reset successfully')
      setData([])
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.detail || 'Failed to reset exam data')
    } finally {
      setResetting(false)
    }
  }

  return (
    <AdminPortalShell title="Interview Dashboard">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="loader" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-2">{stat.label}</p>
                <p className={`text-3xl font-extrabold ${stat.valueClass}`}>{stat.value}</p>
                <p className="text-xs text-slate-400 mt-2">{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end mb-4">
            <button
              type="button"
              disabled={resetting}
              onClick={() => void handleResetExam()}
              className="inline-flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {resetting ? 'Resetting...' : 'Reset Exam Data'}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-bold">Exam Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Username', 'Name', 'Email', 'Aptitude', 'Technical', 'Total', 'Result'].map((heading) => (
                      <th key={heading} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No exam data found.
                      </td>
                    </tr>
                  )}
                  {data.map((user) => (
                    <tr key={user.user_id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-4 text-slate-400">{user.username}</td>
                      <td className="px-5 py-4 font-semibold">{user.name}</td>
                      <td className="px-5 py-4 text-slate-300 text-xs">{user.email}</td>
                      <td className="px-5 py-4 font-mono">
                        <span>{user.aptitude_score}/30</span>
                        <span className="text-xs text-slate-400 ml-1">({user.aptitude_percentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <span>{user.technical_score}/20</span>
                        <span className="text-xs text-slate-400 ml-1">({user.technical_percentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold">
                        <span>{user.total_score}/50</span>
                        <span className="text-xs text-slate-400 ml-1">({user.total_percentage.toFixed(1)}%)</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASSES[user.result] ?? 'bg-white/10 text-slate-300'}`}>
                          {user.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.length > 0 && (
                <div className="flex justify-end p-4">
                  <Button onClick={() => downloadExcel(data)} type="primary" size="small">  
                    Download Excel
                  </Button>
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </AdminPortalShell>
  )
}

export default InterviewDashboard
