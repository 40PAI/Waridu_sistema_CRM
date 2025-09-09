import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

const recentSales = [
  { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "+R$1,999.00", avatar: "/avatars/01.png" },
  { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "+R$39.00", avatar: "/avatars/02.png" },
  { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: "+R$299.00", avatar: "/avatars/03.png" },
  { name: "William Kim", email: "will@email.com", amount: "+R$99.00", avatar: "/avatars/04.png" },
  { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "+R$39.00", avatar: "/avatars/05.png" },
];

export function RecentSales() {
  return (
    <div className="space-y-8">
      {recentSales.map((sale, index) => (
        <div className="flex items-center" key={index}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={sale.avatar} alt="Avatar" />
            <AvatarFallback>{sale.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">
              {sale.email}
            </p>
          </div>
          <div className="ml-auto font-medium">{sale.amount}</div>
        </div>
      ))}
    </div>
  )
}