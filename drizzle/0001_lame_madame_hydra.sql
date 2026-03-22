CREATE TABLE `country_pairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pairId` varchar(16) NOT NULL,
	`country1` varchar(8) NOT NULL,
	`country2` varchar(8) NOT NULL,
	`relationshipType` enum('Allied','Competitive','Hostile','Transactional','Mixed') NOT NULL,
	`tensionScore` int NOT NULL,
	`cooperationScore` int NOT NULL,
	`middleEastImpactScore` int NOT NULL,
	`economicInterdependency` text NOT NULL,
	`tensionPoints` json NOT NULL,
	`cooperationAreas` json NOT NULL,
	`middleEastDimension` text NOT NULL,
	`politicalAnticipation` json NOT NULL,
	`treatyViability` text NOT NULL,
	`winnerAssessment` text NOT NULL,
	`leverageHolder` varchar(64),
	`leverageReason` text,
	`dangerousScenario` text NOT NULL,
	`remainingOptions` json NOT NULL,
	`lastPipelineUpdate` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `country_pairs_id` PRIMARY KEY(`id`),
	CONSTRAINT `country_pairs_pairId_unique` UNIQUE(`pairId`)
);
--> statement-breakpoint
CREATE TABLE `country_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryId` varchar(8) NOT NULL,
	`name` varchar(64) NOT NULL,
	`flag` varchar(8),
	`color` varchar(16),
	`economicPillars` json NOT NULL,
	`keyIndicators` json NOT NULL,
	`vulnerabilities` json NOT NULL,
	`strategicAssets` json NOT NULL,
	`currentPressures` json NOT NULL,
	`middleEastInterests` json NOT NULL,
	`geopoliticalPosture` text NOT NULL,
	`wrdiPolitical` float DEFAULT 5,
	`wrdiMilitary` float DEFAULT 5,
	`wrdiEconomic` float DEFAULT 5,
	`wrdiSocial` float DEFAULT 5,
	`wrdiComposite` float DEFAULT 5,
	`wrdiTrend` enum('rising','falling','stable') DEFAULT 'stable',
	`lastPipelineUpdate` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `country_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `country_profiles_countryId_unique` UNIQUE(`countryId`)
);
--> statement-breakpoint
CREATE TABLE `kb_changelog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('country_profile','country_pair','scenario') NOT NULL,
	`entityId` varchar(32) NOT NULL,
	`fieldChanged` varchar(128) NOT NULL,
	`previousValue` text,
	`newValue` text,
	`triggeringEventIds` json,
	`pipelineRunId` varchar(64),
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kb_changelog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `middle_east_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` varchar(32) NOT NULL,
	`title` varchar(256) NOT NULL,
	`riskLevel` enum('Critical','High','Medium','Low') NOT NULL,
	`probability` enum('High','Medium','Low') NOT NULL,
	`trigger` text NOT NULL,
	`economicImpact` text NOT NULL,
	`politicalImpact` text NOT NULL,
	`marketSignals` json NOT NULL,
	`affectedCountries` json NOT NULL,
	`timeframe` varchar(128) NOT NULL,
	`lastPipelineUpdate` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `middle_east_scenarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `middle_east_scenarios_scenarioId_unique` UNIQUE(`scenarioId`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(64) NOT NULL,
	`sourceUrl` text,
	`eventTitle` text NOT NULL,
	`eventSummary` text,
	`eventDate` timestamp,
	`affectedCountries` json NOT NULL,
	`wrdiDimension` enum('political','military','economic','social','multiple'),
	`severityScore` float,
	`relevanceScore` float,
	`processed` boolean DEFAULT false,
	`appliedToKnowledgeBase` boolean DEFAULT false,
	`rawData` json,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pipeline_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` varchar(64) NOT NULL,
	`status` enum('running','completed','failed') NOT NULL,
	`sourcesQueried` json,
	`eventsIngested` int DEFAULT 0,
	`eventsClassified` int DEFAULT 0,
	`kbFieldsUpdated` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `pipeline_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `pipeline_runs_runId_unique` UNIQUE(`runId`)
);
--> statement-breakpoint
CREATE TABLE `wrdi_metric_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricKey` varchar(64) NOT NULL,
	`label` varchar(128) NOT NULL,
	`dimension` enum('political','military','economic','social','composite') NOT NULL,
	`weight` float,
	`definition` text NOT NULL,
	`dataSource` varchar(256),
	`scaleDescription` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wrdi_metric_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `wrdi_metric_definitions_metricKey_unique` UNIQUE(`metricKey`)
);
