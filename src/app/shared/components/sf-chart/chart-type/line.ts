import * as shap from 'd3-shape';

export class Line {

  public chartNode: any;

  private line: any;

  constructor(svg: any, scaleX: any, scaleY: any, serie: any, data: any[]) {

    this.line = shap.line()
      .x((d: any) => scaleX(d.label))
      .y((d: any) => scaleY(d.value));

    this.chartNode = svg.append('g')
      .datum(data)
      .attr('class', 'line-g')
      .attr('transform', `translate(${scaleX.step() / 2},0)`);

    const pathNode = this.chartNode.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', this.line);

    const symbolNode = this.chartNode.selectAll('.line-symbol')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'line-symbol')
      .attr('stroke', 'red')
      .attr('stroke-width', 1)
      .attr('fill', '#fff')
      .attr('cx', (d: any) => scaleX(d.label))
      .attr('cy', (d: any) => scaleY(d.value))
      .transition()
      .duration(2000)
      .attr('r', 3);

    const length = Infinity;
    pathNode.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0);

  }

  public updateData(scaleX: any, scaleY: any, serie: any, data: any) {
    this.chartNode.datum(data);
    this.resizeChart(scaleX, scaleY);
  }

  public resizeChart(scaleX: any, scaleY: any) {
    this.line = shap.line()
      .x((d: any) => scaleX(d.label))
      .y((d: any) => scaleY(d.value));

    this.chartNode.attr('transform', `translate(${scaleX.step() / 2},0)`);
    const length = Infinity;
    const pathNode = this.chartNode.selectAll('.line')
      .attr('stroke-dasharray', `${length} ${length}`)
      .transition()
      .duration(300)
      .attr('d', this.line);

    this.chartNode.selectAll('.line-symbol')
      .transition()
      .duration(300)
      .attr('cx', (d: any) => scaleX(d.label))
      .attr('cy', (d: any) => scaleY(d.value));
  }
}
