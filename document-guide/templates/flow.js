/* 箱と線の共通描画。
 * 箱の種類は data-kind、変更状態は data-state、接続先は data-from / data-to。
 * 接続の data-kind は線の意味、data-role は主経路上の役割を表す。
 * sequence: 順序、reference: 付属する参照・保存先、branch: 分岐、merge: 合流、comparison: 比較。
 * 順序は縦、補助対象は右。補助列を保てない幅では接続を維持して縦へ配置する。
 */
(() => {
  const namespace = 'http://www.w3.org/2000/svg';
  const figures = [...document.querySelectorAll('.diagram')];
  const graphs = [...document.querySelectorAll('.diagram-graph')];
  const svgElement = (tag, attributes) => {
    const element = document.createElementNS(namespace, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  };

  // 順序は常に縦。横に置けるのは参照・分岐・比較だけとする。
  for (const graph of graphs) {
    for (const edge of graph.querySelectorAll('.diagram-connections > span[data-role="sequence"]')) {
      const from = graph.querySelector(`[data-node="${edge.dataset.from}"]`);
      const to = graph.querySelector(`[data-node="${edge.dataset.to}"]`);
      const row = from?.parentElement;
      if (row?.matches('.diagram-row') && to?.parentElement === row) {
        const next = document.createElement('div');
        next.className = 'diagram-row single';
        next.append(to); row.after(next); row.classList.add('single');
      }
    }
  }

  // 箱ごとに幅を縮めず、同じ図の左右それぞれの列に必要な幅を共有する。
  function measureColumns(figure) {
    if (!figure.getClientRects().length) return;
    const widths = [180, 180];
    for (const node of figure.querySelectorAll('.diagram-node')) {
      const copy = node.cloneNode(true);
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
      copy.style.cssText = 'position:fixed;visibility:hidden;left:0;top:0;width:max-content;max-width:none';
      figure.append(copy);
      const width = Math.min(260, Math.ceil(copy.getBoundingClientRect().width));
      copy.remove();
      const item = node.parentElement.matches('.diagram-stack') ? node.parentElement : node;
      const column = item.previousElementSibling ? 1 : 0;
      widths[column] = Math.max(widths[column], width);
    }
    if (figure.querySelector('[data-subject="comparison"]')) widths.fill(Math.max(...widths));
    figure.style.setProperty('--diagram-left', `${widths[0]}px`);
    figure.style.setProperty('--diagram-right', `${widths[1]}px`);
    const paired = !!figure.querySelector('.diagram-row:not(.single), .diagram-options, .diagram-catalog');
    figure.classList.toggle('diagram-paired', paired);
    // 最小箱幅180pxを保てないとき、補助列だけを縦へ移す。
    figure.classList.toggle('diagram-narrow', figure.clientWidth < 180 * 2 + 72 + 32);
    for (const options of figure.querySelectorAll('.diagram-options')) {
      options.classList.toggle('diagram-stacked', figure.clientWidth < options.children.length * 180 + (options.children.length - 1) * 20 + 32);
    }
  }

  function draw(graph, index) {
    if (!graph.getClientRects().length) return;
    const bounds = graph.getBoundingClientRect();
    const nodes = new Map();
    for (const node of graph.querySelectorAll('[data-node]')) {
      if (nodes.has(node.dataset.node)) throw new Error(`Duplicate diagram node: ${node.dataset.node}`);
      nodes.set(node.dataset.node, node);
    }
    const edges = [...graph.querySelectorAll('.diagram-connections > span')];
    for (const edge of edges) {
      if (!nodes.has(edge.dataset.from) || !nodes.has(edge.dataset.to)) {
        throw new Error(`Unknown diagram connection: ${edge.dataset.from} → ${edge.dataset.to}`);
      }
      if (nodes.get(edge.dataset.from).dataset.kind === 'end' && edge.dataset.kind === 'control') {
        throw new Error(`A terminal node cannot continue: ${edge.dataset.from}`);
      }
    }
    const point = node => {
      const r = node.getBoundingClientRect();
      return { left: r.left - bounds.left, right: r.right - bounds.left, top: r.top - bounds.top,
        bottom: r.bottom - bounds.top, x: r.left + r.width / 2 - bounds.left, y: r.top + r.height / 2 - bounds.top };
    };
    graph.querySelectorAll(':scope > .diagram-wires, :scope > .diagram-edge-label').forEach(element => element.remove());
    const svg = svgElement('svg', { class: 'diagram-wires', viewBox: `0 0 ${bounds.width} ${bounds.height}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const markerId = `diagram-head-${index}`;
    const defs = svgElement('defs', {});
    const marker = svgElement('marker', { id: markerId, markerWidth: 8, markerHeight: 8, refX: 7, refY: 4, orient: 'auto', markerUnits: 'userSpaceOnUse' });
    marker.append(svgElement('path', { d: 'M0,0 L8,4 L0,8 Z', fill: 'currentColor' }));
    defs.append(marker);
    svg.append(defs);
    for (const edge of edges) {
      const from = nodes.get(edge.dataset.from), to = nodes.get(edge.dataset.to);
      const a = point(from), b = point(to);
      const { kind, role } = edge.dataset;
      const sameRow = from.closest('.diagram-row') === to.closest('.diagram-row') && from.closest('.diagram-row');
      let route = role === 'reference' || role === 'comparison' ? (to.parentElement.matches('.diagram-stack') ? 'fan' : 'side')
        : role === 'branch' ? (sameRow ? 'side' : to.parentElement.matches('.diagram-options') ? 'spread' : 'fork')
        : role === 'merge' ? 'join' : from.parentElement.matches('.diagram-options') ? 'continue' : '';
      const narrow = graph.closest('.diagram').classList.contains('diagram-narrow');
      let middle = (a.bottom + b.top) / 2;
      let labelX = (a.x + b.x) / 2, labelY = middle;
      let d, side = false;
      const options = route === 'spread' ? to.parentElement : from.parentElement;
      const stacked = options.matches('.diagram-options') && getComputedStyle(options).gridTemplateColumns.split(' ').length === 1;
      const verticalPair = narrow && sameRow;
      const narrowBranch = narrow && ['fork', 'join'].includes(route);
      const intervening = [...nodes.values()].some(node => {
        if (node === from || node === to || node.contains(from) || node.contains(to)) return false;
        const q = point(node);
        return q.top >= a.bottom - 1 && q.bottom <= b.top + 1;
      });
      if (verticalPair || narrowBranch || (narrow && intervening && !['spread', 'continue'].includes(route))) {
        const down = a.y < b.y;
        const start = down ? a.bottom : a.top, end = down ? b.top : b.bottom;
        const near = down ? start + 20 : start - 20;
        const far = down ? end - 20 : end + 20;
        const rail = role === 'merge' ? bounds.width - 5 : 5;
        const adjacent = Math.abs(end - start) < 75;
        d = adjacent ? `M${a.x},${start} V${(start + end) / 2} H${b.x} V${end}`
          : `M${a.x},${start} V${near} H${rail} V${far} H${b.x} V${end}`;
        labelX = b.x; labelY = adjacent ? (start + end) / 2 : far;
      } else if (route === 'side') {
        const forward = a.x < b.x;
        const start = forward ? a.right : a.left, end = forward ? b.left : b.right;
        d = `M${start},${a.y} H${end}`;
        labelX = (start + end) / 2; labelY = a.y - 7; side = true;
      } else if (route === 'fan') {
        middle = (a.right + b.left) / 2;
        d = `M${a.right},${a.y} H${middle} V${b.y} H${b.left}`;
        labelX = middle; labelY = a.y - 7; side = true;
      } else if (route === 'spread' && stacked) {
        middle = a.bottom + 20;
        d = `M${a.x},${a.bottom} V${middle} H8 V${b.y} H${b.left}`;
      } else if (route === 'continue' && stacked) {
        d = `M${a.right},${a.y} H${bounds.width - 8} V${b.top - 24} H${b.x} V${b.top}`;
        labelX = b.x; labelY = b.top - 24;
      } else {
        if (route === 'fork' || route === 'spread') {
          const siblings = edges.filter(e => e.dataset.from === edge.dataset.from && e.dataset.role === 'branch');
          middle = (a.bottom + Math.min(...siblings.map(e => point(nodes.get(e.dataset.to)).top))) / 2;
        }
        if (route === 'join') {
          const siblings = edges.filter(e => e.dataset.to === edge.dataset.to && e.dataset.role === 'merge');
          middle = (Math.max(...siblings.map(e => point(nodes.get(e.dataset.from)).bottom)) + b.top) / 2;
          labelX = b.x;
        }
        d = `M${a.x},${a.bottom} V${middle} H${b.x} V${b.top}`;
        labelY = middle;
      }
      const path = svgElement('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5,
        'data-from': edge.dataset.from, 'data-to': edge.dataset.to, 'data-kind': kind });
      if (kind !== 'compare') path.setAttribute('marker-end', `url(#${markerId})`);
      if (kind === 'data' || kind === 'compare') path.setAttribute('stroke-dasharray', '5 4');
      if (kind === 'event') path.setAttribute('stroke-dasharray', '2 4');
      svg.append(path);
      if (edge.textContent.trim()) {
        const label = document.createElement('span');
        label.className = `diagram-edge-label${side ? ' side' : ''}`;
        label.innerHTML = edge.innerHTML;
        label.style.left = `${labelX}px`; label.style.top = `${labelY}px`;
        graph.append(label);
        const halfWidth = label.getBoundingClientRect().width / 2;
        label.style.left = `${Math.max(halfWidth + 4, Math.min(bounds.width - halfWidth - 4, labelX))}px`;
        // 長い横ラベルの上端を同じ行に収め、前の行へ重ねない。
        if (side) {
          const row = from.closest('.diagram-row');
          const needed = Math.ceil(label.getBoundingClientRect().height * 2 + 16);
          if (row && row.style.minHeight !== `${needed}px`) row.style.minHeight = `${needed}px`;
        }
      }
    }
    graph.prepend(svg);
  }

  function redraw() {
    figures.forEach(measureColumns);
    for (const row of document.querySelectorAll('.diagram-narrow .diagram-row')) row.style.minHeight = '';
    graphs.forEach(draw);
  }
  const observer = new ResizeObserver(redraw);
  graphs.forEach(graph => observer.observe(graph.querySelector('.diagram-layout')));
  document.fonts.ready.then(redraw);
  window.addEventListener('beforeprint', () => { redraw(); redraw(); });
  window.addEventListener('afterprint', redraw);
  redraw();
})();
