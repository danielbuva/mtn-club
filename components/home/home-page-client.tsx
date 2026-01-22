'use client'

import { ArrowRight, Calendar, Layers2, Layers3, Mountain, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type Filters, FiltersPanel } from "@/components/filters-panel";
import { MemberCTA } from "@/components/member-cta";
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
import { filterTrips } from "@/lib/events/filters";
import { type CalendarTrip } from "@/lib/events/types";

type HomePageProps = {
	trips: CalendarTrip[];
};

export function HomePageClient({ trips }: HomePageProps) {
	const isMobile = useIsMobile();
	const [selectedTrip, setSelectedTrip] = useState<CalendarTrip | null>(null);
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

	const filteredTrips = useMemo(() => {
		return filterTrips(trips, filters);
	}, [filters, trips]);

	const handleTripSelect = (trip: CalendarTrip) => {
		setSelectedTrip(trip);
		setDrawerOpen(true);
	};

	return (
		<>
			<main className="flex-1 relative pt-16">
				<div className="absolute inset-0 pt-16">
					<MapShell
						trips={filteredTrips}
						onTripSelect={handleTripSelect}
						selectedTripId={selectedTrip?.id}
						is3D={is3D}
					/>
				</div>

				{!isMobile && (
					<div className="absolute top-20 left-4 w-96 max-h-[calc(100vh-6rem)] flex flex-col gap-4 z-10">
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
											with UNLV Mountain Club
										</p>
									</div>
								</div>
								<p className="text-muted-foreground text-sm mb-4 leading-relaxed">
									Discover incredible trails, peaks, and outdoor experiences
									across California, Oregon, and Washington.
								</p>
								<div className="flex gap-2">
									<MemberCTA
										className="rounded-xl gap-2"
										icon={<ArrowRight className="w-4 h-4" />}
										memberFallback={
											<Button asChild className="rounded-xl gap-2">
												<Link href="/profile">
													<User className="w-4 h-4" />
													Profile
												</Link>
											</Button>
										}
									/>
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

						<Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
							<CardContent className="p-4">
								<FiltersPanel filters={filters} onFiltersChange={setFilters} />
							</CardContent>
						</Card>

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

			<TripDetailsDrawer
				trip={selectedTrip}
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
			/>
		</>
	);
}
