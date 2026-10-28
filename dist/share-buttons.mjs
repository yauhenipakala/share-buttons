function e(e, t) {
	return e.replace(/\{(\d+)\}/g, (e, n) => String(t[Number(n)] || e));
}
function t(e) {
	return e.join(" - ");
}
function n(...e) {
	window.console.log(...e);
}
function r(e, t = 600, n = 400) {
	let r = window.innerWidth || document.documentElement.clientWidth || screen.width, i = window.innerHeight || document.documentElement.clientHeight || screen.height, a = r / 2 - t / 2 + window.screenLeft, o = i / 3 - n / 3 + window.screenTop, s = window.open(e, "", `resizable,toolbar=yes,location=yes,scrollbars=yes,menubar=yes,width=${t},height=${n},top=${o},left=${a}`);
	s !== null && s.focus && s.focus();
}
// src/handlers.ts
var i = "navigator.share(): ";
function a({ url: e, title: t, desc: n }) {
	return {
		url: encodeURIComponent(e),
		title: encodeURIComponent(t),
		desc: encodeURIComponent(n)
	};
}
var o = (t, n) => (i) => r(e(t, n(a(i)))), s = (e) => (t) => {
	let n = a(t);
	r(e.replace(/\{(url|title|desc)\}/g, (e, t) => n[t]));
}, c = ({ title: e, desc: n }) => t([e, n]), l = (e) => [e.url, e.title], u = (e) => [e.url, c(e)], d = (e) => [c(e), e.url], f = {
	fb: o("https://www.facebook.com/sharer/sharer.php?u={0}&quote={1}", l),
	vk: o("https://vk.com/share.php?url={0}&title={1}", u),
	tw: o("https://x.com/intent/tweet?url={0}&text={1}", u),
	bs: o("https://bsky.app/intent/compose?text={0}%20{1}", d),
	th: o("https://www.threads.com/intent/post?text={0}&url={1}", d),
	tg: o("https://t.me/share/url?url={0}&text={1}", u),
	re: o("https://reddit.com/submit?url={0}&title={1}", l),
	in: o("https://www.linkedin.com/shareArticle?mini=true&url={0}&title={1}&summary={2}&source={0}", (e) => [
		e.url,
		e.title,
		c(e)
	]),
	pi: o("https://pinterest.com/pin/create/button/?url={0}&media={0}&description={1}", u),
	wa: o("https://wa.me/?text={0}%20{1}", d),
	ok: o("https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={0}", (e) => [e.url]),
	tu: o("https://www.tumblr.com/widgets/share/tool?posttype=link&title={0}&caption={0}&content={1}&canonicalUrl={1}&shareSource=tumblr_share_button", d),
	hn: o("https://news.ycombinator.com/submitlink?t={0}&u={1}", d),
	xi: o("https://www.xing.com/app/user?op=share;url={0};title={1}", u),
	mst: o("https://teams.microsoft.com/share?href={0}&assignTitle={1}&msgText={2}", (e) => [
		e.url,
		e.title,
		e.desc
	]),
	mail: (n) => {
		let { url: r, title: i, desc: o } = a(n), s = i || o || "";
		i.length > 0 && o.length > 0 && (s = t([i, o])), r.length > 0 && (s = s + " / " + r), window.location.href = e("mailto:?subject={0}&body={1}", [i, s]);
	},
	print: () => {
		window.print();
	},
	copy: ({ url: e }) => {
		window.navigator.clipboard.writeText(e);
	},
	share: ({ url: e, title: r, desc: a }) => {
		let o = t([r, a]);
		window.navigator.share({
			title: o,
			text: o,
			url: e
		}).catch((e) => {
			n(i + "Error", e);
		});
	}
}, p = [[
	"copy",
	"navigator.clipboard(): ",
	"clipboard"
], [
	"share",
	i,
	"canShare"
]];
function m(e, t) {
	f[e] = typeof t == "string" ? s(t) : t;
}
function h(e, t) {
	return Object.prototype.hasOwnProperty.call(f, e) ? (f[e](t), !0) : !1;
}
// src/share-buttons.ts
var g = "data-sharebtn-ref", _ = 0, v = {};
function y(e) {
	let t = document.querySelector("meta[name=description]");
	return {
		url: e.url || window.location.href || " ",
		title: e.title || document.title || " ",
		desc: e.desc || t && t.getAttribute("content") || " "
	};
}
function b(e, t = {}) {
	return h(e, y(t));
}
function x(e, t) {
	let n = e.getAttribute("data-id");
	if (!n) return;
	let r = e.getAttribute(g);
	r ? (e.removeEventListener("click", v[r]), e.removeEventListener("keydown", v[r])) : (r = String(++_), e.setAttribute(g, r)), v[r] = (e) => {
		if (e.type === "keydown") {
			let t = e.key;
			if (t !== "Enter" && t !== " ") return;
			e.preventDefault();
		}
		h(n, t);
	}, e.addEventListener("click", v[r]), e.hasAttribute("href") || (e.hasAttribute("role") || e.setAttribute("role", "button"), e.hasAttribute("tabindex") || e.setAttribute("tabindex", "0"), e.addEventListener("keydown", v[r]));
}
function S(e) {
	let t = e.querySelectorAll("a"), n = y({
		url: e.getAttribute("data-url"),
		title: e.getAttribute("data-title"),
		desc: e.getAttribute("data-desc")
	});
	for (let e = t.length; e--;) x(t[e], n);
}
function C() {
	let e = document.querySelectorAll(".share-btn");
	for (let t = e.length; t--;) S(e[t]);
	for (let [e, t, r] of p) if (!window.navigator[r]) {
		let r = document.querySelectorAll("[data-id=\"" + e + "\"]");
		for (let e = r.length; e--;) r[e].style.display = "none";
		n(t + "This feature is not supported on this browser or operating system.");
	}
}
typeof document < "u" && C();
export { m as register, b as share, C as update };
