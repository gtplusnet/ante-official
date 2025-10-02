'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function TestQRPage() {
  const [qrData, setQrData] = useState('')
  const [generatedQR, setGeneratedQR] = useState('')

  const sampleData = [
    { id: 'STU-001', name: 'Alice Johnson', type: 'Student', grade: '10-A' },
    { id: 'STU-002', name: 'Bob Smith', type: 'Student', grade: '11-B' },
    { id: 'TCH-001', name: 'Dr. Jane Wilson', type: 'Teacher', subject: 'Mathematics' },
    { id: 'GRD-001', name: 'Robert Johnson', type: 'Guardian', child: 'Alice Johnson' },
  ]

  const generateQR = (data: any) => {
    const jsonData = JSON.stringify(data)
    setQrData(jsonData)
    // In real app, would generate actual QR code image
    // For now, just display the data
    setGeneratedQR(jsonData)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-3xl font-bold">QR Code Test Generator</h1>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sample QR Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleData.map((person) => (
              <div key={person.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-sm text-gray-600">{person.type} - {person.id}</p>
                </div>
                <Button size="sm" onClick={() => generateQR(person)}>
                  Generate
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom QR Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter custom data (text or JSON)
              </label>
              <Input
                type="text"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder='{"id": "TEST-001", "name": "Test User"}'
              />
            </div>
            <Button onClick={() => setGeneratedQR(qrData)} className="w-full">
              Generate Custom QR
            </Button>
          </CardContent>
        </Card>
      </div>

      {generatedQR && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated QR Code Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="font-mono text-sm break-all">{generatedQR}</p>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Use a QR code generator to create an image with this data, then scan it with the Scanner module.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> You can use online QR generators like qr-code-generator.com or qrcode.tec-it.com
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}