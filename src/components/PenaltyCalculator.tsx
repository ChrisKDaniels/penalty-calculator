'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Download, Share2 } from 'lucide-react';

interface LoanDetails {
  projectName: string;
  principal: number;
  baseInterestRate: number;
  weeklyPenaltyRate: number;
  maturityDate: string;
  weeksToProject: number;
}

interface ScheduleRow {
  period: string;
  dateRange: string;
  principal: number;
  interest: number;
  totalReturn: number;
  returnPercentage: number;
}

export function PenaltyCalculator() {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    projectName: '',
    principal: 0,
    baseInterestRate: 0,
    weeklyPenaltyRate: 0,
    maturityDate: '',
    weeksToProject: 6
  });

  useEffect(() => {
    // Parse URL parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLoanDetails = {
        projectName: params.get('project') || '',
        principal: Number(params.get('principal')) || 200000,
        baseInterestRate: Number(params.get('baseRate')) || 16.5,
        weeklyPenaltyRate: Number(params.get('penaltyRate')) || 3.5,
        maturityDate: params.get('maturityDate') || '2024-12-27',
        weeksToProject: Number(params.get('weeks')) || 6
      };
      setLoanDetails(urlLoanDetails);
    }
  }, []);

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  const addDays = (date: string | Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const calculateSchedule = (): ScheduleRow[] => {
    const schedule: ScheduleRow[] = [];
    let currentDate = new Date(loanDetails.maturityDate);
    let baseInterest = (loanDetails.principal * (loanDetails.baseInterestRate / 100));
    
    // Base return
    schedule.push({
      period: 'Base Return',
      dateRange: `Through ${formatDate(currentDate)}`,
      principal: loanDetails.principal,
      interest: baseInterest,
      totalReturn: loanDetails.principal + baseInterest,
      returnPercentage: loanDetails.baseInterestRate
    });

    // Weekly penalties
    for (let week = 1; week <= loanDetails.weeksToProject; week++) {
      const startDate = addDays(currentDate, (week - 1) * 7 + 1);
      const endDate = addDays(startDate, 6);
      const totalInterest = baseInterest * Math.pow(1 + (loanDetails.weeklyPenaltyRate / 100), week);
      
      schedule.push({
        period: `Week ${week} Penalty`,
        dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`,
        principal: loanDetails.principal,
        interest: totalInterest,
        totalReturn: loanDetails.principal + totalInterest,
        returnPercentage: (totalInterest / loanDetails.principal) * 100
      });
    }
    
    return schedule;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  };

  const copyShareLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      Object.entries(loanDetails).forEach(([key, value]) => {
        url.searchParams.set(key, value.toString());
      });
      navigator.clipboard.writeText(url.toString());
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Extended Bridge Loan Return Schedule</CardTitle>
            {loanDetails.projectName && (
              <div className="text-sm text-gray-500 mt-1">{loanDetails.projectName}</div>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loan Details Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
            <div>
              <div className="text-sm text-gray-500">Principal</div>
              <div className="font-medium">{formatCurrency(loanDetails.principal)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Base Rate</div>
              <div className="font-medium">{loanDetails.baseInterestRate}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Weekly Penalty</div>
              <div className="font-medium">{loanDetails.weeklyPenaltyRate}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Maturity Date</div>
              <div className="font-medium">{new Date(loanDetails.maturityDate).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4">Timeline</th>
                  <th className="text-right p-4">Principal</th>
                  <th className="text-right p-4">Interest</th>
                  <th className="text-right p-4">Total Return</th>
                  <th className="text-right p-4">Return %</th>
                </tr>
              </thead>
              <tbody>
                {calculateSchedule().map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-4">
                      <div className="font-medium">{row.period}</div>
                      <div className="text-sm text-gray-500">{row.dateRange}</div>
                    </td>
                    <td className="text-right p-4 font-mono">
                      {formatCurrency(row.principal)}
                    </td>
                    <td className="text-right p-4 font-mono">
                      {formatCurrency(row.interest)}
                    </td>
                    <td className="text-right p-4 font-mono text-blue-600 font-medium">
                      {formatCurrency(row.totalReturn)}
                    </td>
                    <td className="text-right p-4 font-mono text-green-600 font-medium">
                      {formatPercentage(row.returnPercentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}