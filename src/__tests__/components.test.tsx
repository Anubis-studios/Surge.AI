import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from '../store';
import Dashboard from '../pages/Dashboard';
import ImageStudio from '../pages/ImageStudio';
import VideoEngine from '../pages/VideoEngine';
import Billing from '../pages/Billing';
import Rewards from '../pages/Rewards';
import type { ReactNode } from 'react';

// Helper wrapper with all providers
const AllProviders = ({ children }: { children: ReactNode }) => (
  <StoreProvider>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </StoreProvider>
);

describe('Dashboard', () => {
  it('renders welcome message with user name', () => {
    render(<Dashboard />, { wrapper: AllProviders });
    expect(screen.getByText(/Welcome back, Alex Creator/i)).toBeInTheDocument();
  });

  it('displays surge coins balance', () => {
    render(<Dashboard />, { wrapper: AllProviders });
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays surge bucks balance', () => {
    render(<Dashboard />, { wrapper: AllProviders });
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('displays streak count', () => {
    render(<Dashboard />, { wrapper: AllProviders });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('has link to Image Studio', () => {
    render(<Dashboard />, { wrapper: AllProviders });
    expect(screen.getByText('Image Studio')).toBeInTheDocument();
  });

  it('has link to Video Engine', () => {
    render(<Dashboard />, { wrapper: AllProviders });
    expect(screen.getByText('Video Engine')).toBeInTheDocument();
  });

  it('shows daily rewards section', () => {
    render(<Dashboard />, { wrapper: AllProviders });
    expect(screen.getByText(/Daily Rewards/i)).toBeInTheDocument();
  });
});

describe('ImageStudio', () => {
  it('renders page title', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    expect(screen.getByText('Image Studio')).toBeInTheDocument();
  });

  it('has prompt textarea', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    const textarea = screen.getByPlaceholderText(/describe the image/i);
    expect(textarea).toBeInTheDocument();
  });

  it('displays coin balance', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('has generate button', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    const button = screen.getByRole('button', { name: /generate image/i });
    expect(button).toBeInTheDocument();
  });

  it('generate button is disabled when prompt is empty', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    const button = screen.getByRole('button', { name: /generate image/i });
    expect(button).toBeDisabled();
  });

  it('shows style presets', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    expect(screen.getByText('Photorealistic')).toBeInTheDocument();
    expect(screen.getByText('Anime')).toBeInTheDocument();
    expect(screen.getByText('Cyberpunk')).toBeInTheDocument();
  });

  it('shows aspect ratio options', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    expect(screen.getByText('1:1')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('9:16')).toBeInTheDocument();
  });

  it('shows empty state when no images', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    expect(screen.getByText('No images yet')).toBeInTheDocument();
  });

  it('enables generate button when prompt is entered', () => {
    render(<ImageStudio />, { wrapper: AllProviders });
    const textarea = screen.getByPlaceholderText(/describe the image/i);
    fireEvent.change(textarea, { target: { value: 'a beautiful sunset' } });
    
    const button = screen.getByRole('button', { name: /generate image/i });
    expect(button).not.toBeDisabled();
  });
});

describe('VideoEngine', () => {
  it('renders page title', () => {
    render(<VideoEngine />, { wrapper: AllProviders });
    expect(screen.getByText('Video Engine')).toBeInTheDocument();
  });

  it('has prompt textarea', () => {
    render(<VideoEngine />, { wrapper: AllProviders });
    const textarea = screen.getByPlaceholderText(/describe the video/i);
    expect(textarea).toBeInTheDocument();
  });

  it('displays buck balance', () => {
    render(<VideoEngine />, { wrapper: AllProviders });
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('has generate button', () => {
    render(<VideoEngine />, { wrapper: AllProviders });
    const button = screen.getByRole('button', { name: /generate video/i });
    expect(button).toBeInTheDocument();
  });

  it('generate button is disabled when prompt is empty', () => {
    render(<VideoEngine />, { wrapper: AllProviders });
    const button = screen.getByRole('button', { name: /generate video/i });
    expect(button).toBeDisabled();
  });

  it('shows add scene button', () => {
    render(<VideoEngine />, { wrapper: AllProviders });
    expect(screen.getByText('+ Add Scene')).toBeInTheDocument();
  });

  it('shows empty state when no videos', () => {
    render(<VideoEngine />, { wrapper: AllProviders });
    expect(screen.getByText('No videos yet')).toBeInTheDocument();
  });

  it('shows engine info panel', () => {
    render(<VideoEngine />, { wrapper: AllProviders });
    expect(screen.getByText(/Surge.AI Video Engine/i)).toBeInTheDocument();
  });
});

describe('Billing', () => {
  it('renders page title', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('displays current coin balance', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays current buck balance', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('shows all coin bundles', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('Starter Pack')).toBeInTheDocument();
    expect(screen.getByText('Creator Pack')).toBeInTheDocument();
    expect(screen.getByText('Pro Pack')).toBeInTheDocument();
    expect(screen.getByText('Ultra Pack')).toBeInTheDocument();
  });

  it('shows all buck bundles', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('shows coin prices', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('£3')).toBeInTheDocument();
    expect(screen.getByText('£7')).toBeInTheDocument();
    expect(screen.getByText('£15')).toBeInTheDocument();
    expect(screen.getByText('£30')).toBeInTheDocument();
  });

  it('shows buck prices', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('£10')).toBeInTheDocument();
    expect(screen.getByText('£25')).toBeInTheDocument();
    expect(screen.getByText('£50')).toBeInTheDocument();
  });

  it('has purchase buttons for coins', () => {
    render(<Billing />, { wrapper: AllProviders });
    const purchaseButtons = screen.getAllByText('Purchase');
    expect(purchaseButtons.length).toBeGreaterThanOrEqual(7); // 4 coin + 3 buck
  });

  it('shows popular badge on creator pack', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('POPULAR')).toBeInTheDocument();
  });

  it('shows best value badge on medium buck bundle', () => {
    render(<Billing />, { wrapper: AllProviders });
    expect(screen.getByText('BEST VALUE')).toBeInTheDocument();
  });
});

describe('Rewards', () => {
  it('renders page title', () => {
    render(<Rewards />, { wrapper: AllProviders });
    expect(screen.getByText('Daily Rewards')).toBeInTheDocument();
  });

  it('displays current streak', () => {
    render(<Rewards />, { wrapper: AllProviders });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows claim button', () => {
    render(<Rewards />, { wrapper: AllProviders });
    const button = screen.getByRole('button', { name: /claim today's reward/i });
    expect(button).toBeInTheDocument();
  });

  it('shows reward schedule', () => {
    render(<Rewards />, { wrapper: AllProviders });
    expect(screen.getByText('Reward Schedule')).toBeInTheDocument();
  });

  it('shows all day rewards', () => {
    render(<Rewards />, { wrapper: AllProviders });
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    expect(screen.getByText('Day 4')).toBeInTheDocument();
    expect(screen.getByText('Day 5')).toBeInTheDocument();
  });

  it('shows coin amounts for each day', () => {
    render(<Rewards />, { wrapper: AllProviders });
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('shows streak progress bar', () => {
    render(<Rewards />, { wrapper: AllProviders });
    expect(screen.getByText('Streak Progress')).toBeInTheDocument();
  });

  it('explains what surge coins are', () => {
    render(<Rewards />, { wrapper: AllProviders });
    expect(screen.getByText('What are Surge Coins?')).toBeInTheDocument();
  });

  it('explains how streaks work', () => {
    render(<Rewards />, { wrapper: AllProviders });
    expect(screen.getByText('How Streaks Work')).toBeInTheDocument();
  });
});
