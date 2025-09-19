import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Jan 1', score: 82, violations: 45 },
  { date: 'Jan 8', score: 85, violations: 38 },
  { date: 'Jan 15', score: 83, violations: 42 },
  { date: 'Jan 22', score: 87, violations: 35 },
  { date: 'Jan 29', score: 86, violations: 32 },
  { date: 'Feb 5', score: 89, violations: 28 },
  { date: 'Feb 12', score: 87, violations: 32 },
];

export function SecurityMetricsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Trends</CardTitle>
        <CardDescription>
          Security score and violation trends over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              name="Security Score"
            />
            <Line 
              type="monotone" 
              dataKey="violations" 
              stroke="#dc2626" 
              strokeWidth={3}
              dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
              name="Violations"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}