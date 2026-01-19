"use client";

import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Filters {
	search: string;
	season: string;
	difficulty: string;
	activity: string;
	membersOnly: boolean;
}

interface FiltersPanelProps {
	filters: Filters;
	onFiltersChange: (filters: Filters) => void;
	className?: string;
}

const seasons = ["All Seasons", "Spring", "Summer", "Fall", "Winter"];
const difficulties = [
	"All Levels",
	"Easy",
	"Moderate",
	"Challenging",
	"Expert",
];
const activities = ["All Activities", "Hike", "Climb", "Snow", "Camp", "Run"];

export function FiltersPanel({
	filters,
	onFiltersChange,
	className,
}: FiltersPanelProps) {
	const hasActiveFilters =
		filters.search ||
		filters.season !== "All Seasons" ||
		filters.difficulty !== "All Levels" ||
		filters.activity !== "All Activities" ||
		filters.membersOnly;

	const clearFilters = () => {
		onFiltersChange({
			search: "",
			season: "All Seasons",
			difficulty: "All Levels",
			activity: "All Activities",
			membersOnly: false,
		});
	};

	return (
		<div className={cn("space-y-4", className)}>
			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search trips..."
					value={filters.search}
					onChange={(e) =>
						onFiltersChange({ ...filters, search: e.target.value })
					}
					className="pl-10 rounded-xl"
				/>
			</div>

			{/* Filter Selects */}
			<div className="grid grid-cols-2 gap-2">
				<Select
					value={filters.season}
					onValueChange={(value) =>
						onFiltersChange({ ...filters, season: value })
					}
				>
					<SelectTrigger className="rounded-xl">
						<SelectValue placeholder="Season" />
					</SelectTrigger>
					<SelectContent>
						{seasons.map((season) => (
							<SelectItem key={season} value={season}>
								{season}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={filters.difficulty}
					onValueChange={(value) =>
						onFiltersChange({ ...filters, difficulty: value })
					}
				>
					<SelectTrigger className="rounded-xl">
						<SelectValue placeholder="Difficulty" />
					</SelectTrigger>
					<SelectContent>
						{difficulties.map((difficulty) => (
							<SelectItem key={difficulty} value={difficulty}>
								{difficulty}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={filters.activity}
					onValueChange={(value) =>
						onFiltersChange({ ...filters, activity: value })
					}
				>
					<SelectTrigger className="rounded-xl">
						<SelectValue placeholder="Activity" />
					</SelectTrigger>
					<SelectContent>
						{activities.map((activity) => (
							<SelectItem key={activity} value={activity}>
								{activity}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button
					variant={filters.membersOnly ? "default" : "outline"}
					className="rounded-xl"
					onClick={() =>
						onFiltersChange({ ...filters, membersOnly: !filters.membersOnly })
					}
				>
					Members Only
				</Button>
			</div>

			{/* Active Filters */}
			{hasActiveFilters && (
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-xs text-muted-foreground">Active:</span>
					{filters.search && (
						<Badge variant="secondary" className="gap-1">
							{`"${filters.search}"`}
							<button
								onClick={() => onFiltersChange({ ...filters, search: "" })}
							>
								<X className="w-3 h-3" />
							</button>
						</Badge>
					)}
					{filters.season !== "All Seasons" && (
						<Badge variant="secondary" className="gap-1">
							{filters.season}
							<button
								onClick={() =>
									onFiltersChange({ ...filters, season: "All Seasons" })
								}
							>
								<X className="w-3 h-3" />
							</button>
						</Badge>
					)}
					{filters.difficulty !== "All Levels" && (
						<Badge variant="secondary" className="gap-1">
							{filters.difficulty}
							<button
								onClick={() =>
									onFiltersChange({ ...filters, difficulty: "All Levels" })
								}
							>
								<X className="w-3 h-3" />
							</button>
						</Badge>
					)}
					{filters.activity !== "All Activities" && (
						<Badge variant="secondary" className="gap-1">
							{filters.activity}
							<button
								onClick={() =>
									onFiltersChange({ ...filters, activity: "All Activities" })
								}
							>
								<X className="w-3 h-3" />
							</button>
						</Badge>
					)}
					{filters.membersOnly && (
						<Badge variant="secondary" className="gap-1">
							Members Only
							<button
								onClick={() =>
									onFiltersChange({ ...filters, membersOnly: false })
								}
							>
								<X className="w-3 h-3" />
							</button>
						</Badge>
					)}
					<Button
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={clearFilters}
					>
						Clear all
					</Button>
				</div>
			)}
		</div>
	);
}
