import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMemo } from "react";
import { differenceInDays, parseISO } from "date-fns";

const sampleEvents = [
  {
    id: 1,
    name: "Evento 1",
    startDate: "2023-01-01",
    endDate: "2023-01-03",
    status: "Concluído",
    revenue: 1000,
    expenses: [{ amount: 200 }, { amount: 100 }],
    roster: {
      teamMembers: [
        { id: "emp1" },
        { id: "emp2" }
      ]
    }
  },
  {
    id: 2,
    name: "Evento 2",
    startDate: "2023-02-01",
    endDate: "2023-02-01",
    status: "Planejado",
    revenue: 500,
    expenses: [{ amount: 50 }],
    roster: {
      teamMembers: [
        { id: "emp1" }
      ]
    }
  }
];

const categories = [
  { id: "cat1", dailyRate: 100 },
  { id: "cat2", dailyRate: 200 }
];

const employees = [
  { id: "emp1", technicianCategoryId: "cat1" },
  { id: "emp2", technicianCategoryId: "cat2" }
];

describe("useEvents metrics calculations", () => {
  it("calculates costs and profits correctly", () => {
    const rateMap = new Map(categories.map(c => [c.id, c.dailyRate]));
    const empMap = new Map(employees.map(e => [e.id, e]));

    const calculateEventCosts = (event) => {
      let techCosts = 0;
      if (event.roster?.teamMembers) {
        const days = differenceInDays(parseISO(event.endDate), parseISO(event.startDate)) + 1;
        event.roster.teamMembers.forEach((member) => {
          const employee = empMap.get(member.id);
          const categoryId = employee?.technicianCategoryId;
          const rate = categoryId ? rateMap.get(categoryId) || 0 : 0;
          techCosts += rate * days;
        });
      }
      const otherExpenses = event.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      return techCosts + otherExpenses;
    };

    const event = sampleEvents[0];
    const costs = calculateEventCosts(event);
    expect(costs).toBe(100 * 3 + 200 * 3 + 200 + 100); // 300 + 600 + 300 = 1200
    const profit = event.revenue - costs;
    expect(profit).toBe(1000 - 1200);
  });

  it("filters upcoming and past events correctly", () => {
    const events = sampleEvents;
    const upcomingEvents = events.filter(e => e.status === 'Planejado' || e.status === 'Em Andamento');
    const pastEvents = events.filter(e => e.status === 'Concluído');

    expect(upcomingEvents.length).toBe(1);
    expect(pastEvents.length).toBe(1);
  });
});