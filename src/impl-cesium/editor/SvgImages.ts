let svg = (w, h, content) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' 
    width='${w}' height='${h}' viewBox='${-w/2} ${-h/2} ${w} ${h}'%3E${content}%3C/svg%3E`;

let circle = (r, fill, x=0, y=0) => `%3Ccircle fill='${fill}' cx='${x}' cy='${y}' r='${r}'/%3E`;

export default {
    dot: () => svg(20,20,
        circle(7, 'orange') + circle(4, 'steelblue')
    ),
    dot2: () => svg(20,20,
        circle(5, 'orange') + circle(2, 'steelblue')
    ),
    dot3: () => svg(20,20,
        circle(5, 'red') + circle(2, 'steelblue')
    ),
}
