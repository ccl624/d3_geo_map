import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { ChinaMapService } from './china-map.service';
import * as d3 from 'd3';
import 'd3-geo-projection';

@Component({
  selector: 'china-map',
  templateUrl: './china-map.component.html',
  styleUrls: ['./china-map.component.scss']
})

export class ChinaMapComponent implements OnInit, AfterViewInit {

  private svgH = 0;  //

  private svgW = 0;

  private svg: any;

  private defs: any;

  private barSize: any = { // 柱子粗细, w柱子横截面水平宽度, h柱子横截面水平高度, x截面上下两边水平偏移, 模拟3D
    w: 10,
    h: 5,
    x: 5
  };

  public showData: any[] = [
    {
      name: '新疆',
      value: 993
    },
    {
      name: '西藏',
      value: 667
    },
    {
      name: '北京',
      value: 667
    },
    {
      name: '天津',
      value: 667
    },
    {
      name: '河南',
      value: 667
    },
    {
      name: '安徽',
      value: 667
    },
    {
      name: '四川',
      value: 667
    }
    ,
    {
      name: '陕西',
      value: 667
    }
  ];

  @Input() public barColor: any = {
    normal: { // #aedcff #f0302e
      type: 'linear',
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 1,
      colorStops: [{
        offset: 0, color: '#aedcff', opacity: 0.9 // 0% 处的颜色
      }, {
        offset: 0.25, color: '#aedcff', opacity: 0.86
      }, {
        offset: 0.5, color: '#aedcff', opacity: 0.66
      }, {
        offset: 0.85, color: '#aedcff', opacity: 0.1
      }, {
        offset: 1, color: '#aedcff', opacity: 0
      }],
    },
    active: {
      type: 'linear',
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 1,
      colorStops: [{
        offset: 0, color: '#f0302e', opacity: 0.9 // 0% 处的颜色
      }, {
        offset: 0.25, color: '#f0302e', opacity: 0.86
      }, {
        offset: 0.5, color: '#f0302e', opacity: 0.66
      }, {
        offset: 0.85, color: '#f0302e', opacity: 0.1
      }, {
        offset: 1, color: '#f0302e', opacity: 0
      }],
    }
  };

  @Input() public barColorRight: any = {
    normal: { // #aedcff #f0302e
      type: 'linear',
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 1,
      colorStops: [{
        offset: 0, color: '#aedcff', opacity: 0.7 // 0% 处的颜色
      }, {
        offset: 0.25, color: '#aedcff', opacity: 0.66
      }, {
        offset: 0.5, color: '#aedcff', opacity: 0.46
      }, {
        offset: 0.85, color: '#aedcff', opacity: 0.1
      }, {
        offset: 1, color: '#aedcff', opacity: 0
      }],
    },
    active: {
      type: 'linear',
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 1,
      colorStops: [{
        offset: 0, color: '#f0302e', opacity: 0.7 // 0% 处的颜色
      }, {
        offset: 0.25, color: '#f0302e', opacity: 0.66
      }, {
        offset: 0.5, color: '#f0302e', opacity: 0.46
      }, {
        offset: 0.85, color: '#f0302e', opacity: 0.1
      }, {
        offset: 1, color: '#f0302e', opacity: 0
      }],
    }
  };

  @Input() public markColor: any = {
    normal: {
      type: 'linear',
      x1: 0,
      x2: 1,
      y1: 0,
      y2: 0,
      colorStops: [{
        offset: 0, color: '#cec396', opacity: 0// 0% 处的颜色
      }, {
        offset: 0.3, color: '#cec396', opacity: 0.4// 50% 处的颜色
      }, {
        offset: 0.7, color: '#cec396', opacity: 0.4// 50% 处的颜色
      }, {
        offset: 1, color: '#cec396', opacity: 0 // 100% 处的颜色
      }],
    },
    active: {
      type: 'linear',
      x1: 0,
      x2: 1,
      y1: 0,
      y2: 0,
      colorStops: [{
        offset: 0, color: '#f0302e', opacity: 0// 0% 处的颜色
      }, {
        offset: 0.3, color: '#f0302e', opacity: 0.4// 30% 处的颜色
      }, {
        offset: 0.7, color: '#f0302e', opacity: 0.4// 40% 处的颜色
      }, {
        offset: 1, color: '#f0302e', opacity: 0 // 100% 处的颜色
      }],
    }
  };

  @Input() public scale = 880;

  @Input()
  public get data(): any[] {
    return this.showData;
  }
  public set data(v: any[]) {
    this.showData = v;
    if (this.isLodadingMapDtaCompleted) {
      this.updateMapData();
    }
  }

  private isLodadingMapDtaCompleted = false;

  private barDegree = 1 / 1000;

  private transition: any;

  private showMarker = true;

  private barG: any;

  private markerG: any;

  private dataShapeG: any;

  private preDuration = 100; // 每根柱子动画间隔

  constructor(
    private chinaMapService: ChinaMapService
  ) { }

  public ngOnInit() {
    this.transition = d3.transition().duration(1000);
    this.barSize.w = this.scale * this.barDegree * 10;
    this.barSize.h = this.scale * this.barDegree * 5;
    this.barSize.x = this.scale * this.barDegree * 5;
  }

  public ngAfterViewInit() {
    this.initSvg();
    this.createGradient();
    this.createFilter('china_map_filter');
    this.getChinaMapData();
  }

  private initSvg() {
    const d3GeoNode = d3.select('#d3-geo');
    this.svgW = Number.parseFloat(d3GeoNode.style('width'));
    this.svgH = Number.parseFloat(d3GeoNode.style('height'));
    this.svg = d3.select('#d3-geo').append('svg').attr('width', this.svgW).attr('height', this.svgH);
    this.defs = this.svg.append('defs');
  }

  private startAnimate() {
    this.showData = [
      { name: '新疆', value: 993 * Math.random() },
      { name: '西藏', value: 667 * Math.random() },
      { name: '北京', value: 667 * Math.random() },
      { name: '天津', value: 667 * Math.random() },
      { name: '河南', value: 667 * Math.random() }
    ];

    this.updateMapData();
  }

  private getChinaMapData() {
    Promise.all([this.getChinaJSON(), this.getChinaMapOutLine()]).then((res: any) => {
      const projection = this.initProjection(res[0].cp);
      this.drawChinaOutLineMap(res[1].features, projection);

      const gNodes = this.initGNodes(res[0].features, 'china-map');
      this.drawChinaMap(gNodes, projection);
      this.drawMapData(gNodes, projection);
      this.isLodadingMapDtaCompleted = true;
    });
  }

  private initProjection(center: [number, number] = [0, 0]) {
    return d3.geoMercator()
      .center(center)
      .scale(this.scale)
      .translate([this.svgW / 2, this.svgH / 2]);
  }

  private initGNodes(mapData: any[], classStr: string) {
    const tarData = mapData.map((d: any) => {
      const data = this.showData.find(dataItem => dataItem.name === d.properties.name);
      const maxData = Math.max.apply(null, this.showData.map(item => item.value));
      const value = data ? data.value : 0;
      const height = data ? data.value / maxData * 100 : 0;
      return Object.assign(d, { value, height });
    }).sort((d: any) => d.height ? -1 : 1);
    return this.svg.selectAll(classStr).data(tarData).enter().append('g').attr('class', classStr);
  }

  private drawChinaOutLineMap(data: any, projection: any) {
    const gNodes = this.svg.selectAll('.china-map-outline')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'china-map-outline');

    gNodes.append('path')
      .attr('transform', 'translate(0,15)')
      .attr('class', 'outline-filter')
      .attr('d', d3.geoPath(projection))
      .attr('fill', 'none')
      .attr('stroke', '#9fc8e7')
      .attr('filter', 'url(#china_map_filter)')
      .attr('stroke-width', '1');


    gNodes.append('path')
      .attr('class', 'outline')
      .attr('d', d3.geoPath(projection))
      .attr('fill', 'none')
      .attr('stroke', '#9fc8e7')
      .attr('stroke-width', 2)
      .call(this.nodeAction.bind(this));
  }

  private drawChinaMap(gNodes: any, projection: any) {
    const mapG = gNodes.append('g').attr('class', 'mapG');

    mapG.append('path')
      .attr('class', 'batman-path')
      .attr('d', d3.geoPath(projection))
      .attr('fill', 'none')
      .attr('stroke', '#e7d9a41a')
      .attr('stroke-width', '2');
  }

  private drawMapData(gNodes: any, projection: any) {

    this.dataShapeG = gNodes.append('g')
      .attr('class', 'data-shape-g')
      .attr('id', (d: any, index: number) => 'data-shape-g' + index)
      .attr('transform', (d: any) => `translate(${projection(d.properties.cp)})`)
      .call(this.nodeAction.bind(this));

    this.drawCpName(this.dataShapeG);
    this.drawMapBar(this.dataShapeG);
    this.drawMapMarker(this.dataShapeG);
  }

  private drawCpName(nodes: any) {
    const cpNmaeG = nodes.append('g').attr('class', 'cp-name data-shape-child');

    cpNmaeG.append('text')
      .text((d: any) => d.properties.name)
      .attr('transform', 'translate(-8,0) scale(0.8)')
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('fill', '#e7d9a466');

    cpNmaeG.append('circle')
      .attr('class', 'cp-icon')
      .attr('r', 3)
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#e3d49d');
  }

  private drawMapBar(gNodes: any) {
    const z = this.barSize.h;
    const x = this.barSize.x;
    const w = this.barSize.w;

    this.barG = gNodes.append('g')
      .attr('class', 'barG data-shape-child')
      .attr('transform', `translate(${- x - 1.5},0)`)
      .attr('cursor', 'pointer')
      .style('display', (d: any) => d.height ? 'block' : 'none');


    this.barG.append('path')
      .attr('class', 'rightSauare')
      .attr('fill', 'url(#china_bar_right)')
      .attr('stroke-width', 1)
      .attr('stroke', 'rgba(0,0,0,0)')
      .attr('d', (d: any) => {
        const height = 0;
        return `M${w},0 L${w},${-height} L${x + w},${-height - z} L${x + w},${-z} L${w},${0} Z `;
      })
      .transition(this.transition)
      .delay((d: any, i: number) => d.height ? i * this.preDuration : 0)
      .attr('d', (d: any) => {
        const height = d.height;
        return `M${w},0 L${w},${-height} L${x + w},${-height - z} L${x + w},${-z} L${w},${0} Z `;
      });

    this.barG.append('path')
      .attr('class', 'frontSauare')
      .attr('fill', 'url(#china_bar_front)')
      .attr('stroke-width', 1)
      .attr('stroke', 'rgba(0,0,0,0)')
      .attr('d', (d: any) => {
        const height = 0;
        return `M0,0 L0,${-height} L${w},${-height} L${w},${0} Z`;
      })
      .transition(this.transition)
      .delay((d: any, i: number) => d.height ? i * this.preDuration : 0)
      .attr('d', (d: any) => {
        const height = d.height;
        return `M0,0 L0,${-height} L${w},${-height} L${w},${0} Z`;
      });

    this.barG.append('path')
      .attr('class', 'topSauare')
      .attr('fill', '#aedcffb3')
      .attr('stroke-width', 0)
      .attr('stroke', 'rgba(0,0,0,0)')
      .attr('d', (d: any) => {
        const height = 0;
        return `M0,${-height} L${w},${-height} L${x + w},${-height - z} L${x},${-height - z} Z`;
      })
      .transition(this.transition)
      .delay((d: any, i: number) => d.height ? i * this.preDuration : 0)
      .attr('d', (d: any) => {
        const height = d.height;
        return `M0,${-height} L${w},${-height} L${x + w},${-height - z} L${x},${-height - z} Z`;
      });
  }

  private drawMapMarker(gNodes: any) {
    const markerH = 36;
    if (!this.showMarker) {
      return false;
    }
    this.markerG = gNodes.append('g')
      .attr('class', 'markG data-shape-child')
      .attr('cursor', 'pointer')
      .attr('transform', `translate(${-3},${-16 - 48}) scale(0.8, 1)`)
      .style('display', 'none');

    this.markerG.append('rect')
      .attr('class', 'text-wrap')
      .attr('x', (d: any) => -this.getTextWidth('访问量：' + d.value.toFixed(2)) / 2)
      .attr('width', (d: any) => d.value ? this.getTextWidth('访问量：' + d.value.toFixed(2)) : 0)
      .attr('height', markerH)
      .attr('fill', 'url(#china_marker_color)')
      .attr('y', -(markerH + 2) / 2)
      .attr('transform', `translate(5,0)`);

    this.markerG.append('text')
      .attr('class', 'marker-text-name')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#cec396')
      .attr('transform', `translate(5,${-markerH / 4})`)
      .text((d: any) => d.properties.name);

    this.markerG.append('text')
      .attr('class', 'marker-text-num')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#cec396')
      .attr('transform', `translate(5,${markerH / 4})`)
      .transition(this.transition)
      .delay((d: any, i: number) => d.height ? i * this.preDuration : 0)
      .textTween((d: any) => (t: number) => t * d.value ? '访问量：' + (t * d.value).toFixed(2) : '');

    this.markerG.append('path')
      .attr('class', 'arrow-icon')
      .attr('d', (d: any) => {
        const c = 0;
        const dh = markerH / 2 + 3;
        return `M${c},${dh} L${c + 4},${dh} L${c},${dh + 8}, L${c - 4},${dh} Z`;
      })
      .attr('fill', (d: any) => d.height ? '#aedcff' : 'none')
      .attr('transform', `translate(5,0)`);

    this.drawMarkFrame(this.markerG, markerH);

    this.markerG.transition(this.transition)
      .delay((d: any, i: number) => d.height ? i * this.preDuration : 0)
      .attr('transform', (d: any) => `translate(${-3},${- d.height - 40}) scale(0.8, 1)`)
      .on('end', (d: any, index: number) => {
        if (index === this.showData.length - 1) {
          const t = setTimeout(() => {
            this.startAnimate();
            clearTimeout(t);
          }, 1000);
        }

      });
  }

  private drawMarkFrame(markG: any, markerH: number) {
    const frameGNode = markG.append('g')
      .attr('class', 'frame-g');

    const frameDh = markerH / 2;
    const frameW = 6;

    frameGNode.append('path')
      .attr('class', 'marker-frame marker-frame-left-top')
      .attr('d', (d: any) => {
        const c = -this.getTextWidth('访问量：' + d.value.toFixed(2)) / 2;
        const dh = -frameDh;
        return `M${c + frameW},${dh} L${c},${dh}`;
      })
      .attr('stroke', '#aedcff')
      .attr('stroke-width', (d: any) => d.height ? 2 : 0);

    frameGNode.append('path')
      .attr('class', 'marker-frame marker-frame-right-top')
      .attr('d', (d: any) => {
        const c = this.getTextWidth('访问量：' + d.value.toFixed(2)) / 2 + frameW;
        const dh = -frameDh;
        return `M${c},${dh} L${c + frameW},${dh}`;
      })
      .attr('stroke', '#aedcff')
      .attr('stroke-width', (d: any) => d.height ? 2 : 0);

    frameGNode.append('path')
      .attr('class', 'marker-frame marker-frame-left-bottom')
      .attr('d', (d: any) => {
        const c = -this.getTextWidth('访问量：' + d.value.toFixed(2)) / 2;
        const dh = frameDh - 1;
        return `M${c + frameW},${dh} L${c},${dh}`;
      })
      .attr('stroke', '#aedcff')
      .attr('stroke-width', (d: any) => d.height ? 2 : 0);

    frameGNode.append('path')
      .attr('class', 'marker-frame marker-frame-right-bottom')
      .attr('d', (d: any) => {
        const c = this.getTextWidth('访问量：' + d.value.toFixed(2)) / 2 + frameW;
        const dh = frameDh - 1;
        return `M${c},${dh} L${c + frameW},${dh}`;
      })
      .attr('stroke', '#aedcff')
      .attr('stroke-width', (d: any) => d.height ? 2 : 0);
  }

  private updateMapData() {
    this.dataShapeG.each((d: any, index: number) => {
      const data = this.showData.find(dataItem => dataItem.name === d.properties.name);
      const maxData = Math.max.apply(null, this.showData.map(item => item.value));
      const value = data ? data.value : 0;
      const height = data ? data.value / maxData * 100 : 0;
      d = Object.assign(d, { value, height });
    });

    this.updateMapBar(this.barG);
    this.updateMarker(this.markerG);
  }

  private updateMapBar(barG: any) {
    const z = this.barSize.h;
    const x = this.barSize.x;
    const w = this.barSize.w;

    barG.style('display', (d: any) => (d.height ? 'block' : 'none'))
      .selectAll('.rightSauare')
      .transition(this.transition)
      .attr('d', (d: any) => {
        const height = d.height;
        return `M${w},0 L${w},${-height} L${x + w},${-height - z} L${x + w},${-z} L${w},${0} Z `;
      });

    barG.selectAll('.frontSauare')
      .transition(this.transition)
      .attr('d', (d: any) => {
        const height = d.height;
        return `M0,0 L0,${-height} L${w},${-height} L${w},${0} Z`;
      });

    barG.selectAll('.topSauare')
      .transition(this.transition)
      .attr('d', (d: any) => {
        const height = d.height;
        return `M0,${-height} L${w},${-height} L${x + w},${-height - z} L${x},${-height - z} Z`;
      });
  }

  private updateMarker(markerG: any) {
    markerG.selectAll('.text-wrap')
      .attr('x', (d: any) => -this.getTextWidth('访问量：' + d.value.toFixed(2)) / 2)
      .transition(this.transition)
      .attr('width', (d: any) => d.value ? this.getTextWidth('访问量：' + d.value.toFixed(2)) : 0);

    markerG.selectAll('.marker-text-num')
      .transition(this.transition)
      .textTween((d: any) => (t: number) => t * d.value ? '访问量：' + (t * d.value).toFixed(2) : '');
    // markerG.selectAll('.arrow-icon').attr('fill', (d: any) => d.value ? '#aedcff' : 'none');
    markerG.selectAll('.marker-frame').attr('stroke-width', (d: any) => d.value ? 2 : 0);
    markerG.transition(this.transition)
      .attr('transform', (d: any) => `translate(${-3},${- d.height - 40}) scale(0.8, 1)`)
      .on('end', (d: any, index: number) => {
        if (index === this.showData.length - 1) {
          const t = setTimeout(() => {
            this.startAnimate();
            clearTimeout(t);
          }, 1000);
        }
      });
  }

  private activeBar(node: any, isActive = true) {
    node.selectAll('.rightSauare').attr('fill', isActive ? 'url(#china_bar_right_active)' : 'url(#china_bar_right)');
    node.selectAll('.frontSauare').attr('fill', isActive ? 'url(#china_bar_front_active)' : 'url(#china_bar_front)');
    node.selectAll('.topSauare').attr('fill', isActive ? '#f0302eb3' : '#aedcffb3');
  }

  private activeMarker(node: any, isActive = true) {
    node.select('.markG').selectAll('.text-wrap').attr('fill', isActive ? 'url(#china_marker_color_active)' : 'url(#china_marker_color)');
    node.select('.markG').selectAll('.arrow-icon').attr('fill', isActive ? '#f0302e' : '#aedcff');
    node.select('.markG').selectAll('.marker-frame').attr('stroke', isActive ? '#f0302e' : '#aedcff');
  }

  private activeCpIcon(node: any, isActive = true) {
    node.select('.cp-icon').attr('fill', isActive ? '#f0302e' : '#cec396');
  }

  private activeNodes(node: any, active: boolean) {
    this.activeBar(node, active);
    this.activeMarker(node, active);
    this.activeCpIcon(node, active);
  }

  private mapMouseEvent(node: any) {
    const that = this;
    node.on('mouseout', function () {
      d3.select(this).select('.markG').style('display', 'none');
      that.activeNodes(d3.select(this), false);
    }).on('mouseover', function (d: any, index: number) {
      that.activeNodes(d3.select(this), true);
      that.svg.selectAll('.china-map').sort((a: any, b: any) => a.properties.name === d.properties.name ? 1 : -1);
      d3.select(this).select('.markG').style('display', d.height ? 'block' : 'none');
      //(d: any) => d.height ? 'block' : 'none'
    });
  }

  private blingAnimate(node: any, attr: any, value: string) {
    node.transition()
      .duration(600)
      .attr(attr.name, value)
      .on('end', () => {
        const nextValue = value === attr.values[0] ? attr.values[1] : attr.values[0];
        this.blingAnimate(node, attr, nextValue);
      });
  }

  private nodeAction(node: any) {
    const className = node.attr('class');
    switch (className) {
      case 'data-shape-g':
        this.mapMouseEvent(node);
        break;
      case 'outline':
        const attr = { name: 'stroke-width', values: ['0', '2'], };
        this.blingAnimate(node, attr, '0');
        break;
      default:
        console.log('所选元素不存在，请查看class属性是否撇皮！');
        break;
    }
  }

  private createGradient() {
    this.createLinearGradient('china_bar_front', this.barColor.normal);
    this.createLinearGradient('china_bar_right', this.barColorRight.normal);
    this.createLinearGradient('china_marker_color', this.markColor.normal);
    this.createLinearGradient('china_bar_front_active', this.barColor.active);
    this.createLinearGradient('china_bar_right_active', this.barColorRight.active);
    this.createLinearGradient('china_marker_color_active', this.markColor.active);
  }

  private createLinearGradient(id: string, color: any) {
    const linearGradient = this.defs.append('linearGradient')
      .attr('id', id)
      .attr('x1', color.x1)
      .attr('y1', color.y1)
      .attr('x2', color.x2)
      .attr('y2', color.y2);

    color.colorStops.forEach((stop: any) => { // stop-opacity
      linearGradient.append('stop')
        .attr('offset', stop.offset)
        .attr('stop-opacity', stop.opacity)
        .style('stop-color', color.colorStops[0].color);
    });
  }

  private createFilter(id: string) {
    const filter = this.defs.append('filter')
      .attr('id', id);

    filter.append('feGaussianBlur')
      .attr('result', 'blurOut')
      .attr('in', 'offOut')
      .attr('stdDeviation', 1); // 阴影模糊度
  }

  private getTextWidth(str: string) {
    const span = d3.select('body').append('span').style('display', 'inline-block').text(str);
    const spanWidth = Number.parseInt(span.style('width'), 10) + 10;
    span.remove();
    return spanWidth;
  }

  private getChinaMapOutLine() {
    return new Promise(resolve => this.chinaMapService.getChinaMapOutlineJSON().subscribe((res: any) => resolve(res)));
  }

  private getChinaJSON() {
    return new Promise(resolve => this.chinaMapService.getChinaJSON().subscribe((res: any) => resolve(res)));
  }
}
