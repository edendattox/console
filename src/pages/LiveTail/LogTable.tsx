import { FC, useEffect } from 'react';
import { ScrollArea, Table, Box } from '@mantine/core';
import { Tbody, Thead } from '@/components/Table';
import LogRow from './LogRow';
import useMountedState from '@/hooks/useMountedState';
import Column from './Column';
import { useHeaderContext } from '@/layouts/MainLayout/Context';
import { useDoGetLiveTail } from '@/hooks/useDoGetLiveTail';
import EmptyBox from '@/components/Empty';
import { useLiveTailTableStyles } from './styles';

const LogTable: FC = () => {
	const { data, doGetLiveTail, resetData, abort, loading, schema } = useDoGetLiveTail();
	const {
		state: { subInstanceConfig, subLogQuery, subLiveTailsStatus },
	} = useHeaderContext();

	const [grpcPort, setGrpcPort] = useMountedState<number | null>(subInstanceConfig.get()?.grpcPort ?? null);
	const [currentStreamName, setCurrentStreamName] = useMountedState<string>(subLogQuery.get().streamName ?? '');
	const [callAgain, setCallAgain] = useMountedState<boolean>(false);

	useEffect(() => {
		const streamlistener = subLogQuery.subscribe((state) => {
			if (state.streamName) {
				setCurrentStreamName(state.streamName);
			}
		});
		const portListener = subInstanceConfig.subscribe((state) => {
			if (state) {
				setGrpcPort(state.grpcPort);
			}
		});

		const liveTailStatus = subLiveTailsStatus.subscribe((value) => {
			if (value === 'abort') {
				abort();
			} else if (value === 'fetch') {
				setCallAgain(true);
			}
		});

		return () => {
			streamlistener();
			portListener();
			liveTailStatus();
		};
	}, [subLogQuery, subInstanceConfig, subLiveTailsStatus]);

	useEffect(() => {
		if (currentStreamName && grpcPort) {
			doGetLiveTail(currentStreamName, grpcPort);
		}

		return () => {
			abort();
			resetData();
		};
	}, [grpcPort, currentStreamName]);

	useEffect(() => {
		if (callAgain) {
			doGetLiveTail(currentStreamName, grpcPort);
		}
	}, [callAgain]);

	useEffect(() => {
		if (loading) {
			subLiveTailsStatus.set('streaming');
		} else {
			subLiveTailsStatus.set('stopped');
			setCallAgain(false);
		}
	}, [loading]);

	const headerRows = schema?.map((element) => <Column key={element.name} columnName={element.name} />);

	const { classes } = useLiveTailTableStyles();

	const { container, tableStyle, theadStyle, tableContainer, innerContainer } = classes;

	return (
		<Box className={container}>
			<Box className={innerContainer}>
				<Box className={innerContainer} style={{ display: 'flex', flexDirection: 'row' }}>
					{data.length > 0 ? (
						<ScrollArea
							styles={() => ({
								scrollbar: {
									'&[data-orientation="vertical"] .mantine-ScrollArea-thumb': {
										display: 'none',
									},
								},
							})}>
							<Box className={tableContainer}>
								<Table className={tableStyle}>
									<Thead className={theadStyle}>{headerRows}</Thead>
									<Tbody>
										<LogRow logData={data || []} logsSchema={schema || []} />
									</Tbody>
								</Table>
							</Box>
						</ScrollArea>
					) : (
						<EmptyBox message="No Data Available" />
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default LogTable;