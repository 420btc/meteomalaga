import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Svg, Rect, Line, Text as SvgText, G } from 'react-native-svg';

interface RainHistoryChartProps {
  data: { date: string; amount: number }[];
  height?: number;
  width?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const RainHistoryChart: React.FC<RainHistoryChartProps> = ({ 
  data, 
  height = 200, 
  width = screenWidth - 40 
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height, width }]}>
        <Text style={styles.noDataText}>No hay datos disponibles</Text>
      </View>
    );
  }

  // Find the maximum rain amount for scaling
  const maxAmount = Math.max(...data.map(item => item.amount), 10);
  
  // Chart dimensions
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / data.length - 4;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <View style={[styles.container, { height, width }]}>
      <Text style={styles.title}>Historial de Precipitaciones</Text>
      <Svg height={height} width={width}>
        {/* Y-axis */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#CCCCCC"
          strokeWidth="1"
        />
        
        {/* X-axis */}
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#CCCCCC"
          strokeWidth="1"
        />
        
        {/* Y-axis labels */}
        <SvgText
          x={padding - 5}
          y={padding}
          fontSize="10"
          fill="#666666"
          textAnchor="end"
        >
          {maxAmount}mm
        </SvgText>
        
        <SvgText
          x={padding - 5}
          y={height - padding}
          fontSize="10"
          fill="#666666"
          textAnchor="end"
        >
          0mm
        </SvgText>
        
        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.amount / maxAmount) * chartHeight;
          const x = padding + index * (chartWidth / data.length) + 2;
          const y = height - padding - barHeight;
          
          return (
            <G key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#3B82F6"
                rx={4}
              />
              
              <SvgText
                x={x + barWidth / 2}
                y={height - padding + 15}
                fontSize="8"
                fill="#666666"
                textAnchor="middle"
              >
                {formatDate(item.date)}
              </SvgText>
              
              <SvgText
                x={x + barWidth / 2}
                y={y - 5}
                fontSize="8"
                fill="#666666"
                textAnchor="middle"
              >
                {item.amount > 0 ? `${item.amount}mm` : ''}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 80,
    color: '#999999',
    fontStyle: 'italic',
  },
});

export default RainHistoryChart;
