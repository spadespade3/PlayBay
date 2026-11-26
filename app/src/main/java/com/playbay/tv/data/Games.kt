package com.playbay.tv.data

/**
 * Placeholder library entry. Artwork is generated in-app from [artStyle], so the
 * project ships no bitmap assets and no third-party game art.
 */
data class Game(
    val id: String,
    val title: String,
    val genre: String,
    val players: String,
    val tagline: String,
    val artStyle: GameArtStyle,
)

enum class GameArtStyle {
    Demo,
    Arcade,
    BlockWorld,
    Racing,
}

data class RecentGame(
    val game: Game,
    val playedLabel: String,
)

object PlayBayCatalog {

    val games: List<Game> = listOf(
        Game(
            id = "playbay-demo",
            title = "PlayBay Demo",
            genre = "Showcase",
            players = "1 player",
            tagline = "The first look at PlayBay, built for the biggest screen in the house.",
            artStyle = GameArtStyle.Demo,
        ),
        Game(
            id = "arcade",
            title = "Arcade",
            genre = "Party",
            players = "1-4 players",
            tagline = "A rotating set of quick-fire challenges. Pick up, play, pass the remote.",
            artStyle = GameArtStyle.Arcade,
        ),
        Game(
            id = "block-world",
            title = "Block World",
            genre = "Puzzle",
            players = "1 player",
            tagline = "Stack, clear, and chase the line. A quiet puzzle for long evenings.",
            artStyle = GameArtStyle.BlockWorld,
        ),
        Game(
            id = "racing",
            title = "Racing",
            genre = "Racing",
            players = "1-2 players",
            tagline = "Three laps, one couch, no brakes. Local split-screen when it ships.",
            artStyle = GameArtStyle.Racing,
        ),
    )

    private val byId: Map<String, Game> = games.associateBy { it.id }

    fun game(id: String): Game = byId.getValue(id)

    val recentlyPlayed: List<RecentGame> = listOf(
        RecentGame(byId.getValue("arcade"), "Preview session"),
        RecentGame(byId.getValue("racing"), "Preview session"),
        RecentGame(byId.getValue("block-world"), "Preview session"),
    )
}
