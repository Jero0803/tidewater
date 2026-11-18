// The level curve (D32): going from level N to N + 1 takes 600 × 1.03^(N − 1) XP. No level cap (D8).
// On its own (no imports) so the landing page can read levels from the saves without loading the game.
export const LEVEL_BASE_XP = 600;
export const LEVEL_GROWTH = 1.03;

export const xpToNext = ( level ) => Math.round( LEVEL_BASE_XP * LEVEL_GROWTH ** ( level - 1 ) );

export function totalXpForLevel( level ) {

	let xp = 0;
	for ( let n = 1; n < level; n ++ ) xp += xpToNext( n );
	return xp;

}

// level reached with `xp` total experience, the XP already earned into it and what the next level needs
export function levelFromXp( xp ) {

	let level = 1, rest = Math.max( 0, Math.floor( xp ) ), need = xpToNext( 1 );
	while ( rest >= need ) {

		rest -= need;
		level ++;
		need = xpToNext( level );

	}

	return { level, into: rest, need };

}
