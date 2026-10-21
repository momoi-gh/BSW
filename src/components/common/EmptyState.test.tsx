import { render, screen } from '@testing-library/react';
import { MessageSquare } from 'lucide-react';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={MessageSquare} title="没有会话" description="稍后再试" />);

    expect(screen.getByRole('heading', { name: '没有会话' })).toBeInTheDocument();
    expect(screen.getByText('稍后再试')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <EmptyState title="空">
        <button type="button">新建会话</button>
      </EmptyState>,
    );

    expect(screen.getByRole('button', { name: '新建会话' })).toBeInTheDocument();
  });
});
