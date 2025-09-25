import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { TaskWithSubtasks } from '@/types/database';
import { format } from 'date-fns';

export const exportGanttChartAsPDF = async (
  chartElement: HTMLElement,
  projectName: string
) => {
  try {
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a3',
    });
    
    const imgWidth = 400;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(40);
    pdf.text(`${projectName} - Gantt Chart`, 14, 15);
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Generated on ${format(new Date(), 'PPP')}`, 14, 22);
    
    // Add chart image
    pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
    
    pdf.save(`${projectName}-gantt-chart.pdf`);
  } catch (error) {
    console.error('Error exporting chart as PDF:', error);
    throw error;
  }
};

export const generateAnalysisReport = (
  tasks: TaskWithSubtasks[],
  projectName: string,
  projectDescription?: string,
  startDate?: Date,
  endDate?: Date
) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Helper function to flatten tasks
  const flattenTasks = (tasks: TaskWithSubtasks[], level = 0): any[] => {
    const result: any[] = [];
    tasks.forEach(task => {
      result.push({ ...task, level });
      if (task.subtasks && task.subtasks.length > 0) {
        result.push(...flattenTasks(task.subtasks, level + 1));
      }
    });
    return result;
  };

  const allTasks = flattenTasks(tasks);

  // Calculate statistics
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const blockedTasks = allTasks.filter(t => t.status === 'blocked').length;
  const todoTasks = allTasks.filter(t => t.status === 'todo').length;
  
  const averageProgress = allTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / totalTasks;
  const completionRate = (completedTasks / totalTasks) * 100;

  // Add cover page
  pdf.setFontSize(28);
  pdf.setTextColor(33, 37, 41);
  pdf.text('Project Analysis Report', 105, 50, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setTextColor(59, 130, 246);
  pdf.text(projectName, 105, 65, { align: 'center' });
  
  if (projectDescription) {
    pdf.setFontSize(12);
    pdf.setTextColor(108, 117, 125);
    const lines = pdf.splitTextToSize(projectDescription, 170);
    pdf.text(lines, 105, 80, { align: 'center' });
  }
  
  pdf.setFontSize(10);
  pdf.setTextColor(134, 142, 150);
  pdf.text(`Report Generated: ${format(new Date(), 'PPP')}`, 105, 120, { align: 'center' });
  
  if (startDate && endDate) {
    pdf.text(`Project Duration: ${format(startDate, 'PP')} - ${format(endDate, 'PP')}`, 105, 130, { align: 'center' });
  }

  // Add executive summary page
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setTextColor(33, 37, 41);
  pdf.text('Executive Summary', 14, 20);
  
  pdf.setFontSize(12);
  pdf.setTextColor(73, 80, 87);
  
  // Summary statistics
  const summaryY = 35;
  pdf.setFontSize(14);
  pdf.setTextColor(33, 37, 41);
  pdf.text('Project Statistics', 14, summaryY);
  
  pdf.setFontSize(11);
  pdf.setTextColor(73, 80, 87);
  const stats = [
    `Total Tasks: ${totalTasks}`,
    `Completed: ${completedTasks} (${completionRate.toFixed(1)}%)`,
    `In Progress: ${inProgressTasks}`,
    `To Do: ${todoTasks}`,
    `Blocked: ${blockedTasks}`,
    `Average Progress: ${averageProgress.toFixed(1)}%`,
  ];
  
  stats.forEach((stat, index) => {
    pdf.text(stat, 20, summaryY + 10 + (index * 7));
  });

  // Progress visualization
  const chartY = summaryY + 60;
  pdf.setFontSize(14);
  pdf.setTextColor(33, 37, 41);
  pdf.text('Task Status Distribution', 14, chartY);
  
  // Draw progress bars
  const barY = chartY + 10;
  const barHeight = 8;
  const barMaxWidth = 150;
  
  const statusData = [
    { label: 'Completed', value: completedTasks, color: [34, 197, 94] },
    { label: 'In Progress', value: inProgressTasks, color: [251, 146, 60] },
    { label: 'To Do', value: todoTasks, color: [59, 130, 246] },
    { label: 'Blocked', value: blockedTasks, color: [239, 68, 68] },
  ];
  
  statusData.forEach((status, index) => {
    const y = barY + (index * 15);
    const width = (status.value / totalTasks) * barMaxWidth;
    
    pdf.setFontSize(10);
    pdf.setTextColor(73, 80, 87);
    pdf.text(status.label, 20, y + 5);
    
    pdf.setFillColor(status.color[0], status.color[1], status.color[2]);
    pdf.rect(70, y, width, barHeight, 'F');
    
    pdf.setTextColor(108, 117, 125);
    pdf.text(`${status.value} (${((status.value / totalTasks) * 100).toFixed(1)}%)`, 225, y + 5);
  });

  // Add detailed task list
  pdf.addPage();
  pdf.setFontSize(20);
  pdf.setTextColor(33, 37, 41);
  pdf.text('Detailed Task List', 14, 20);
  
  // Prepare table data
  const tableData = allTasks.map(task => [
    '  '.repeat(task.level) + task.title,
    format(new Date(task.start_date), 'PP'),
    format(new Date(task.end_date), 'PP'),
    task.status.replace('_', ' '),
    `${task.progress}%`,
    task.assignee?.full_name || task.assignee?.email || '-',
  ]);

  // Add task table
  autoTable(pdf, {
    head: [['Task Name', 'Start Date', 'End Date', 'Status', 'Progress', 'Assignee']],
    body: tableData,
    startY: 30,
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [73, 80, 87],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 },
    },
  });

  // Add critical path analysis (if needed)
  const criticalTasks = allTasks.filter(t => t.status === 'blocked' || t.progress < 50);
  if (criticalTasks.length > 0) {
    pdf.addPage();
    pdf.setFontSize(20);
    pdf.setTextColor(33, 37, 41);
    pdf.text('Critical Tasks', 14, 20);
    
    pdf.setFontSize(12);
    pdf.setTextColor(239, 68, 68);
    pdf.text('Tasks requiring immediate attention:', 14, 30);
    
    const criticalTableData = criticalTasks.map(task => [
      task.title,
      task.status.replace('_', ' '),
      `${task.progress}%`,
      task.description || 'No description',
    ]);
    
    autoTable(pdf, {
      head: [['Task', 'Status', 'Progress', 'Description']],
      body: criticalTableData,
      startY: 40,
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [73, 80, 87],
      },
    });
  }

  // Save the PDF
  pdf.save(`${projectName}-analysis-report.pdf`);
};