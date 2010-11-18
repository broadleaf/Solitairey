YUI.add("monte-carlo", function (Y) {

var Solitaire = Y.Solitaire,
    ns = Y.namespace("MonteCarlo"),
    MonteCarlo = instance(Solitaire, {
	fields: ["Foundation", "Deck", "Tableau"],

	/*
	autoPlay: function (card, e) {
	},
	*/

	deal: function () {
		var card,
		    stack,
		    i,
		    deck = this.deck,
		    stacks = this.tableau.stacks;

		for (stack = 0; stack < 5; stack++) {
			for (i = 0; i < 5; i++) {
				card = deck.pop().faceUp();
				stacks[stack].push(card);
			}
		}

		deck.createStack();
	},

	redeal: function () {
		var stacks = this.tableau.stacks,
		    deck = this.deck.stacks[0],
		    cards = Y.Array.reduce(stacks, [], function (compact, stack) {
			return compact.concat(stack.compact());
			}),
		    len = cards.length,
		    card,
		    s, i;

		Y.Array.each(stacks, function (stack) {
			stack.node.remove();
			stack.cards = [];
			stack.createNode();
		});

		for (i = s = 0; i < len; i++) {
			if (i && !(i % 5)) { s++; }
			stacks[s].push(cards[i]);
		}

		while (i < 25 && deck.cards.length) {
			if (!(i % 5)) { s++; }
			card = deck.last().faceUp();
			card.moveTo(stacks[s]);
			card.node.setStyle("zIndex", 100 - i);
			i++;
		}

	},

	Stack: instance(Solitaire.Stack, {

		updateDragGroups: function () {
			var active = Solitaire.activeCard;

			Y.Array.each(this.cards, function (c) {
				if (!c) { return; }

				if (active.validTarget(c)) {
					c.node.drop.addToGroup("open");
				} else
					c.node.drop.removeFromGroup("open");
			});
		},

		index: function () { return 0; }
	}),

	Events: instance(Solitaire.Events, {
		dragCheck: function (card, e) {
			if (!Solitaire.game.autoPlay(card, e)) {
				Solitaire.Events.dragCheck(card, e);
			}
		},

		drop: function (e) {
			var active = Solitaire.activeCard,
			    foundation = Solitaire.game.foundation.stacks[0];
			    target = e.drop.get("node").getData("target");

			if (!active) { return; }
			target.moveTo(foundation);
			active.moveTo(foundation);
		}
	}),

	Foundation: {
		stackConfig: {
			total: 1,
			layout: {
				spacing: 0,
				top: 0,
				left: function () { return Solitaire.Card.width * 8.5; }
			}
		},
		field: "foundation"
	},

	Deck: instance(Solitaire.Deck, {
		stackConfig: {
			total: 1,
			layout: {
				spacing: 0,
				top: 0,
				left: 0
			}
		},
		field: "deck",

		createStack: function () {
			var i, len;

			for (i = 0, len = this.cards.length; i < len; i++) {
				this.stacks[0].push(this.cards[i]);
			}
		}
	}),

	Tableau: {
		stackConfig: {
			total: 5,
			layout: {
				vspacing: 1.25,
				hspacing: 0,
				top: 0,
				left: function () { return Solitaire.Card.width * 1.5; }
			}
		},
		field: "tableau"
	},

	Card: instance(Solitaire.Card, {
		row: function () {
			return this.stack.index();
		},

		column: function () {
			return this.stack.cards.indexOf(this);
		},

		validTarget: function (card) {
			if (!(this.rank === card.rank && card.isFree())) { return false; }

			return Math.abs(card.row() - this.row()) <= 1 &&
				Math.abs(card.column() - this.column()) <= 1;
		},

		createProxyStack: function () {
			this.proxyStack = this.isFree() ? this.stack : null;

			return this.proxyStack;
		},

		proxyCards: function () {
			return [this];
		},

		isFree: function () {
			return this.stack.field === "tableau";
		},

		turnOver: function () {
			this.stack.field === "deck" && Solitaire.game.redeal();
		},

		createStack: function () {},

		stackHelper: function () {
			this.dragStack = {cards: []};
			return this.node;
		}
	})
});

Y.Array.each(MonteCarlo.fields, function (field) {
	MonteCarlo[field].Stack = instance(MonteCarlo.Stack);
});

Y.mix(MonteCarlo.Tableau.Stack, {
	deleteItem: function (card) {
		var cards = this.cards,
		    i = cards.indexOf(card);

		if (i !== -1) { cards[i] = null; }
	},

	layout: function (layout) {
		var hoffset = layout.hoffset * Solitaire.Card.width,
		    voffset = layout.voffset * Solitaire.Card.height,
		    self = this;

		Y.Array.each(["top", "left"], function (p) {
			self[p] = normalize(layout[p]);
		});

		this.left += hoffset;
		this.top += voffset;
	},

	setCardPosition: function (card) {
		var last = this.cards.last(),
		    top = this.top,
		    left = last ? last.left + card.width * 1.25 : this.left;

		card.left = left;
		card.top = top;
	},

	compact: function () {
		var cards = this.cards,
		    card,
		    compact = [],
		    i, len;

		for (i = 0, len = cards.length; i < len; i++) {
			card = cards[i];
			if (card) {
				compact.push(card);
				card.pushPosition();
			}
		}

		return compact;
	},

	index: function () {
		return Solitaire.game.tableau.stacks.indexOf(this);
	}
}, true);

Y.mix(MonteCarlo.Deck.Stack, {
	cssClass: "freestack",

	updateDragGroups: function () {
		var active = Solitaire.activeCard,
		    card = this.last();

		if (!card) { return; }

		if (active.validTarget(card)) {
			card.node.drop.addToGroup("open");
		} else {
			card.node.drop.removeFromGroup("open");
		}
	},

	createNode: function () {
		Solitaire.Stack.createNode.call(this);
		this.node.on("click", Solitaire.Events.clickEmptyDeck);
	}
}, true);

ns.game = MonteCarlo;

}, "0.0.1", {requires: ["solitaire", "array-extras"]});