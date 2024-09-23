export const enum WritingMode {
	HorizontalTBLR = "horizontal-tb-lr",
	HorizontalTBRL = "horizontal-tb-rl",
	HorizontalLR = "horizontal-lr",
	HorizontalRL = "horizontal-rl",
	VerticalLR = "vertical-lr",
	VerticalRL = "vertical-rl",
}

export const WRITING_MODE_LABELS: Record<WritingMode, string> = {
	[WritingMode.HorizontalTBLR]: "左至右橫排文字；垂直排列候選詞",
	[WritingMode.HorizontalTBRL]: "右至左橫排文字；垂直排列候選詞",
	[WritingMode.HorizontalLR]: "左至右橫排文字；從左至右水平排列候選詞",
	[WritingMode.HorizontalRL]: "右至左橫排文字；從右至左水平排列候選詞",
	[WritingMode.VerticalLR]: "豎排文字；從左至右水平排列候選詞",
	[WritingMode.VerticalRL]: "豎排文字；從右至左水平排列候選詞",
};

export const enum ShowComments {
	Always = "always",
	NonEmojiOnly = "non_emoji_only",
	Never = "never",
}

export const SHOW_COMMMENTS_LABELS: Record<ShowComments, string> = {
	[ShowComments.Always]: "顯示 Always Show",
	[ShowComments.NonEmojiOnly]: "僅非表情符號 Only Non-Emoji Candidates",
	[ShowComments.Never]: "隱藏 Hide",
};

export const RIME_KEY_MAP: Record<string, string | undefined> = {
	"Escape": "Escape",
	"F4": "F4",
	"Backspace": "BackSpace",
	"Delete": "Delete",
	"Tab": "Tab",
	"Enter": "Return",
	"Home": "Home",
	"End": "End",
	"PageUp": "Page_Up",
	"PageDown": "Page_Down",
	"ArrowUp": "Up",
	"ArrowRight": "Right",
	"ArrowDown": "Down",
	"ArrowLeft": "Left",
	"~": "asciitilde",
	"`": "quoteleft",
	"!": "exclam",
	"@": "at",
	"#": "numbersign",
	"$": "dollar",
	"%": "percent",
	"^": "asciicircum",
	"&": "ampersand",
	"*": "asterisk",
	"(": "parenleft",
	")": "parenright",
	"-": "minus",
	"_": "underscore",
	"+": "plus",
	"=": "equal",
	"{": "braceleft",
	"[": "bracketleft",
	"}": "braceright",
	"]": "bracketright",
	":": "colon",
	";": "semicolon",
	'"': "quotedbl",
	"'": "apostrophe",
	"|": "bar",
	"\\": "backslash",
	"<": "less",
	",": "comma",
	">": "greater",
	".": "period",
	"?": "question",
	"/": "slash",
	" ": "space",
};

export const ordinalSuffixes: Record<string, string | undefined> = {
	1: "st",
	2: "nd",
	3: "rd",
};
