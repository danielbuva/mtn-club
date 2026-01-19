// import { DeployButton } from "@/components/deploy-button";
// import { EnvVarWarning } from "@/components/env-var-warning";
// import { AuthButton } from "@/components/auth-button";
// import { Hero } from "@/components/hero";
// import { ThemeSwitcher } from "@/components/theme-switcher";
// import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
// import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
// import { hasEnvVars } from "@/lib/utils";
// import Link from "next/link";
// import { Suspense } from "react";

// export default function Home() {
//   return (
//     <main className="min-h-screen flex flex-col items-center">
//       <div className="flex-1 w-full flex flex-col gap-20 items-center">
//         <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
//           <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
//             <div className="flex gap-5 items-center font-semibold">
//               <Link href={"/"}>Next.js Supabase Starter</Link>
//               <div className="flex items-center gap-2">
//                 <DeployButton />
//               </div>
//             </div>
//             {!hasEnvVars ? (
//               <EnvVarWarning />
//             ) : (
//               <Suspense>
//                 <AuthButton />
//               </Suspense>
//             )}
//           </div>
//         </nav>
//         <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
//           <Hero />
//           <main className="flex-1 flex flex-col gap-6 px-4">
//             <h2 className="font-medium text-xl mb-4">Next steps</h2>
//             {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
//           </main>
//         </div>

//         <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
//           <p>
//             Powered by{" "}
//             <a
//               href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
//               target="_blank"
//               className="font-bold hover:underline"
//               rel="noreferrer"
//             >
//               Supabase
//             </a>
//           </p>
//           <ThemeSwitcher />
//         </footer>
//       </div>
//     </main>
//   );
// }


"use client";

import { ArrowRight, Calendar, Layers2, Layers3, Mountain } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type Filters, FiltersPanel } from "@/components/filters-panel";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { MapShell } from "@/components/map-shell";
import { TripCard } from "@/components/trip-card";
import { TripDetailsDrawer } from "@/components/trip-details-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { type Trip, trips } from "@/lib/data";

export default function HomePage() {
	const isMobile = useIsMobile();
	const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [is3D, setIs3D] = useState(false);
	const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
	const [filters, setFilters] = useState<Filters>({
		search: "",
		season: "All Seasons",
		difficulty: "All Levels",
		activity: "All Activities",
		membersOnly: false,
	});

	// Filter trips
	const filteredTrips = useMemo(() => {
		return trips.filter((trip) => {
			// Search filter
			if (filters.search) {
				const searchLower = filters.search.toLowerCase();
				if (
					!trip.title.toLowerCase().includes(searchLower) &&
					!trip.state.toLowerCase().includes(searchLower)
				) {
					return false;
				}
			}

			// Season filter
			if (filters.season !== "All Seasons") {
				const seasonTag = filters.season.toLowerCase();
				if (!trip.tags.includes(seasonTag)) return false;
			}

			// Difficulty filter
			if (filters.difficulty !== "All Levels") {
				if (trip.difficulty !== filters.difficulty) return false;
			}

			// Activity filter
			if (filters.activity !== "All Activities") {
				const activityTag = filters.activity.toLowerCase();
				if (!trip.tags.includes(activityTag)) return false;
			}

			// Members only filter
			if (filters.membersOnly && !trip.membersOnly) return false;

			return true;
		});
	}, [filters]);

	const handleTripSelect = (trip: Trip) => {
		setSelectedTrip(trip);
		setDrawerOpen(true);
	};

	return (
		<div className="min-h-screen flex flex-col">
			<Header />

			{/* Main Map Area */}
			<main className="flex-1 relative pt-16">
				{/* Map */}
				<div className="absolute inset-0 pt-16">
					<MapShell
						trips={filteredTrips}
						onTripSelect={handleTripSelect}
						selectedTripId={selectedTrip?.id}
						is3D={is3D}
					/>
				</div>

				{/* Desktop Floating Panel */}
				{!isMobile && (
					<div className="absolute top-20 left-4 w-96 max-h-[calc(100vh-6rem)] flex flex-col gap-4 z-10">
						{/* Hero Card */}
						<Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
							<CardContent className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground">
										<Mountain className="w-6 h-6" />
									</div>
									<div>
										<h1 className="text-xl font-bold">
											Explore the West Coast
										</h1>
										<p className="text-sm text-muted-foreground">
											with Mountain Club
										</p>
									</div>
								</div>
								<p className="text-muted-foreground text-sm mb-4 leading-relaxed">
									Discover incredible trails, peaks, and outdoor experiences
									across California, Oregon, and Washington.
								</p>
								<div className="flex gap-2">
									<Link href="/membership">
										<Button className="rounded-xl gap-2">
											Become a Member
											<ArrowRight className="w-4 h-4" />
										</Button>
									</Link>
									<Link href="/calendar">
										<Button
											variant="outline"
											className="rounded-xl gap-2 bg-transparent"
										>
											<Calendar className="w-4 h-4" />
											Trips
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>

						{/* Filters */}
						<Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
							<CardContent className="p-4">
								<FiltersPanel filters={filters} onFiltersChange={setFilters} />
							</CardContent>
						</Card>

						{/* Trip Scroller */}
						<Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl overflow-hidden flex-1 min-h-0">
							<CardContent className="p-4">
								<div className="flex items-center justify-between mb-3">
									<h2 className="font-semibold">Our Latest Trips</h2>
									<span className="text-sm text-muted-foreground">
										{filteredTrips.length} trips
									</span>
								</div>
								<div className="space-y-3 max-h-75 overflow-y-auto pr-1">
									{filteredTrips.slice(0, 6).map((trip) => (
										<TripCard
											key={trip.id}
											trip={trip}
											variant="compact"
											onClick={() => handleTripSelect(trip)}
											className={
												selectedTrip?.id === trip.id
													? "ring-2 ring-primary"
													: ""
											}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* 2D/3D Toggle */}
				<div className="absolute top-20 right-4 z-10">
					<Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
						<CardContent className="p-1">
							<div className="flex rounded-xl overflow-hidden">
								<button
									onClick={() => setIs3D(false)}
									className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
										!is3D
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<Layers2 className="w-4 h-4" />
									2D
								</button>
								<button
									onClick={() => setIs3D(true)}
									className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
										is3D
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<Layers3 className="w-4 h-4" />
									3D
								</button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Mobile Bottom Sheet */}
				{isMobile && (
					<Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
						<SheetTrigger asChild>
							<div className="absolute bottom-0 left-0 right-0 z-10">
								<Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl rounded-b-none rounded-t-3xl">
									<CardContent className="p-4">
										<div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
										<div className="flex items-center justify-between">
											<div>
												<h2 className="font-semibold">Explore Trips</h2>
												<p className="text-sm text-muted-foreground">
													{filteredTrips.length} adventures available
												</p>
											</div>
											<Button className="rounded-xl">View All</Button>
										</div>
									</CardContent>
								</Card>
							</div>
						</SheetTrigger>
						<SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
							<SheetHeader className="text-left mb-4">
								<SheetTitle>Explore Trips</SheetTitle>
							</SheetHeader>

							<FiltersPanel
								filters={filters}
								onFiltersChange={setFilters}
								className="mb-4"
							/>

							<div className="space-y-3 overflow-y-auto max-h-[calc(85vh-200px)]">
								{filteredTrips.map((trip) => (
									<TripCard
										key={trip.id}
										trip={trip}
										onClick={() => {
											handleTripSelect(trip);
											setMobileSheetOpen(false);
										}}
									/>
								))}
							</div>
						</SheetContent>
					</Sheet>
				)}
			</main>

			{/* Trip Details Drawer */}
			<TripDetailsDrawer
				trip={selectedTrip}
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
			/>
		</div>
	);
}
