'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import ProtectedRoute from '../../lib/protected-route'

export default function SupabaseExample() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      const { data, error } = await supabase
        .from('your_table_name') // Replace with your actual table name
        .select('*')

      if (error) throw error

      setData(data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Supabase Integration Example</h1>
        
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">Setup Instructions:</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a></li>
            <li>Get your Project URL and anon key from Project Settings → API</li>
            <li>Add them to your <code className="bg-gray-200 px-1 rounded">.env.local</code> file</li>
            <li>Replace <code className="bg-gray-200 px-1 rounded">your_table_name</code> with your actual table name</li>
          </ol>
        </div>

        <div className="mb-4">
          <button 
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Fetch Data from Supabase'}
          </button>
        </div>

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-2">Data from Supabase:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}